// ─── MechIQ Oil Sampling Cloudflare Worker ────────────────────────────────────
// Cron: every 6 hours
// Polls Gmail IMAP via Gmail API, extracts PDF text, sends to Claude,
// saves to Supabase, auto-creates Work Orders for Critical results

const GMAIL_USER = 'me';
const OIL_EMAIL_PREFIX = 'oilsamples+';
const POLL_INTERVAL_HOURS = 6;

// Subject keywords that indicate oil analysis reports
const OIL_KEYWORDS = [
  'oil analysis', 'oil sample', 'lube report', 'fluid analysis',
  'used oil', 'oil report', 'sample results', 'wear metals',
  'tribology', 'lubrication analysis',
];

// ── Main scheduled handler ────────────────────────────────────────────────────
export default {
  async scheduled(event, env, ctx) {
    try {
      console.log('Oil sampling worker starting...');
      const token = await getGmailToken(env);
      const emails = await fetchUnreadOilEmails(token, env);
      console.log(`Found ${emails.length} oil report emails`);

      for (const email of emails) {
        await processEmail(email, token, env);
      }
      console.log('Oil sampling worker complete');
    } catch (err) {
      console.error('Worker error:', err);
    }
  },

  // Also allow manual trigger via HTTP for testing
  async fetch(request, env) {
    if (request.method === 'POST' && new URL(request.url).pathname === '/trigger') {
      const token = await getGmailToken(env);
      const emails = await fetchUnreadOilEmails(token, env);
      let processed = 0;
      for (const email of emails) {
        await processEmail(email, token, env);
        processed++;
      }
      return new Response(JSON.stringify({ processed }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('MechIQ Oil Sampling Worker', { status: 200 });
  }
};

// ── Gmail OAuth token (using refresh token) ───────────────────────────────────
async function getGmailToken(env) {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      refresh_token: env.GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Failed to get Gmail token: ' + JSON.stringify(data));
  return data.access_token;
}

// ── Fetch unread emails matching oil report keywords ──────────────────────────
async function fetchUnreadOilEmails(token, env) {
  // Build Gmail search query
  const keywordQuery = OIL_KEYWORDS.map(k => `subject:"${k}"`).join(' OR ');
  const query = `is:unread to:${env.OIL_EMAIL_ADDRESS} (${keywordQuery})`;
  const encoded = encodeURIComponent(query);

  const resp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encoded}&maxResults=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await resp.json();
  if (!data.messages) return [];

  // Fetch full message details
  const emails = await Promise.all(
    data.messages.map(m => fetchEmailDetail(m.id, token))
  );
  return emails.filter(Boolean);
}

async function fetchEmailDetail(id, token) {
  const resp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return await resp.json();
}

// ── Extract company slug from To: header ──────────────────────────────────────
function extractCompanySlug(email) {
  const headers = email.payload?.headers || [];
  const toHeader = headers.find(h => h.name.toLowerCase() === 'to')?.value || '';
  // Match oilsamples+SLUG@mechiq.com.au
  const match = toHeader.match(/oilsamples\+([a-zA-Z0-9\-_]+)@/);
  return match ? match[1] : null;
}

// ── Get company_id from slug ──────────────────────────────────────────────────
async function getCompanyFromSlug(slug, env) {
  // Slug is first 8 chars of company UUID
  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/companies?id=ilike.${slug}%&select=id,name`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      }
    }
  );
  const data = await resp.json();
  return data?.[0] || null;
}

// ── Extract PDF attachments from email ────────────────────────────────────────
async function getPdfAttachments(email, token) {
  const parts = flattenParts(email.payload?.parts || []);
  const pdfParts = parts.filter(p =>
    p.mimeType === 'application/pdf' ||
    p.filename?.toLowerCase().endsWith('.pdf')
  );

  const pdfs = [];
  for (const part of pdfParts) {
    if (part.body?.data) {
      pdfs.push({ filename: part.filename, data: part.body.data });
    } else if (part.body?.attachmentId) {
      const resp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}/attachments/${part.body.attachmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const att = await resp.json();
      if (att.data) pdfs.push({ filename: part.filename, data: att.data });
    }
  }
  return pdfs;
}

function flattenParts(parts) {
  const result = [];
  for (const part of parts) {
    result.push(part);
    if (part.parts) result.push(...flattenParts(part.parts));
  }
  return result;
}

// ── Extract text from PDF (using pdf.co API or basic base64 decode) ───────────
async function extractPdfText(pdfBase64, env) {
  // Use pdf.co API if available, otherwise send raw base64 to Claude
  // Claude can read base64-encoded PDFs directly via document blocks
  return pdfBase64; // Pass raw base64 — Claude handles it
}

// ── Send PDF to Claude for structured extraction ──────────────────────────────
async function extractWithClaude(pdfBase64, emailSubject, env) {
  const systemPrompt = `You are an expert oil analysis engineer. Extract all data from this oil analysis lab report PDF and return ONLY a valid JSON object with no preamble, no markdown, no explanation.

Required JSON structure:
{
  "asset_number": "string - the asset/unit/machine ID from the report",
  "asset_name": "string or null - machine name/description if present",
  "component": "string - one of: engine, hydraulic, transmission, final_drive, differential, coolant, other",
  "lab_name": "string - the laboratory name",
  "sample_date": "YYYY-MM-DD date string",
  "oil_hours": number or null,
  "unit_hours": number or null,
  "wear_metals": {
    "fe": number or null,
    "cu": number or null,
    "al": number or null,
    "cr": number or null,
    "pb": number or null,
    "sn": number or null,
    "si": number or null,
    "na": number or null,
    "k": number or null,
    "mo": number or null,
    "b": number or null,
    "ni": number or null,
    "ti": number or null
  },
  "viscosity_40": number or null,
  "viscosity_100": number or null,
  "water_ppm": number or null,
  "soot_percent": number or null,
  "tbn": number or null,
  "tan": number or null,
  "lab_condition": "string - the lab's own condition rating if present",
  "ai_condition": "Normal" or "Monitor" or "Critical",
  "ai_analysis": "2-3 sentence plain English summary of what these results indicate about the equipment health",
  "ai_recommendations": "Specific actionable recommendations e.g. resample at 250hrs, drain and refill, inspect piston rings, reduce drain interval"
}

For ai_condition use:
- Normal: all values within acceptable limits, equipment healthy
- Monitor: one or more values elevated but not yet critical, watch closely
- Critical: values significantly elevated indicating likely component wear or failure, immediate action required`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: `Email subject: "${emailSubject}"\n\nExtract all oil analysis data from this report and return the JSON object.`,
          }
        ],
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  // Clean and parse JSON
  const clean = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error('Failed to parse Claude response:', text);
    return null;
  }
}

// ── Match asset by asset_number in company ────────────────────────────────────
async function matchAsset(assetNumber, companyId, env) {
  if (!assetNumber) return null;
  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/assets?company_id=eq.${companyId}&asset_number=ilike.${encodeURIComponent(assetNumber)}&select=id,name,asset_number&limit=1`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      }
    }
  );
  const data = await resp.json();
  return data?.[0] || null;
}

// ── Save oil sample to Supabase ───────────────────────────────────────────────
async function saveOilSample(result, asset, companyId, emailSubject, emailDate, env) {
  const record = {
    company_id: companyId,
    asset_id: asset?.id || null,
    asset_number: result.asset_number,
    asset_name: asset?.name || result.asset_name || null,
    sample_date: result.sample_date,
    component: result.component,
    lab_name: result.lab_name,
    oil_hours: result.oil_hours,
    unit_hours: result.unit_hours,
    wear_metals: result.wear_metals,
    viscosity_40: result.viscosity_40,
    viscosity_100: result.viscosity_100,
    water_ppm: result.water_ppm,
    soot_percent: result.soot_percent,
    tbn: result.tbn,
    tan: result.tan,
    ai_condition: result.ai_condition,
    ai_analysis: result.ai_analysis,
    ai_recommendations: result.ai_recommendations,
    raw_email_subject: emailSubject,
    raw_email_date: emailDate,
  };

  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/oil_samples`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(record),
  });
  const data = await resp.json();
  return data?.[0] || null;
}

// ── Auto-create Work Order for Critical results ───────────────────────────────
async function createWorkOrder(result, asset, companyId, sampleId, env) {
  const wo = {
    company_id: companyId,
    asset: asset?.name || result.asset_number || 'Unknown Asset',
    defect_description: `Oil Analysis - Critical: ${result.ai_analysis}`,
    priority: 'Critical',
    status: 'Open',
    source: 'oil_sample',
    comments: `AI Recommendations: ${result.ai_recommendations}\n\nComponent: ${result.component}\nLab: ${result.lab_name}\nSample Date: ${result.sample_date}`,
  };

  await fetch(`${env.SUPABASE_URL}/rest/v1/work_orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify(wo),
  });
  console.log(`Work order created for critical oil sample - ${asset?.name || result.asset_number}`);
}

// ── Mark email as read ────────────────────────────────────────────────────────
async function markEmailRead(emailId, token) {
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  });
}

// ── Update last_polled_at in email_connections ────────────────────────────────
async function updateLastPolled(companyId, env) {
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/email_connections?company_id=eq.${companyId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ last_polled_at: new Date().toISOString() }),
    }
  );
}

// ── Process a single email ────────────────────────────────────────────────────
async function processEmail(email, token, env) {
  try {
    const headers = email.payload?.headers || [];
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
    const emailDate = headers.find(h => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

    // Get company from email slug
    const slug = extractCompanySlug(email);
    if (!slug) {
      console.log(`No company slug found in email ${email.id}, skipping`);
      await markEmailRead(email.id, token);
      return;
    }

    const company = await getCompanyFromSlug(slug, env);
    if (!company) {
      console.log(`No company found for slug ${slug}, skipping`);
      await markEmailRead(email.id, token);
      return;
    }

    console.log(`Processing email for company: ${company.name}`);

    // Get PDF attachments
    const pdfs = await getPdfAttachments(email, token);
    if (pdfs.length === 0) {
      console.log(`No PDF attachments in email ${email.id}`);
      await markEmailRead(email.id, token);
      return;
    }

    for (const pdf of pdfs) {
      console.log(`Processing PDF: ${pdf.filename}`);
      const result = await extractWithClaude(pdf.data, subject, env);

      if (!result) {
        console.log(`Claude extraction failed for ${pdf.filename}`);
        continue;
      }

      // Match asset
      const asset = await matchAsset(result.asset_number, company.id, env);
      if (!asset) {
        console.log(`No asset match for ${result.asset_number} in company ${company.name}`);
      }

      // Save sample
      const saved = await saveOilSample(result, asset, company.id, subject, emailDate, env);
      console.log(`Saved oil sample: ${result.asset_number} - ${result.ai_condition}`);

      // Auto work order if critical
      if (result.ai_condition === 'Critical' && saved) {
        await createWorkOrder(result, asset, company.id, saved.id, env);
      }

      // Update connection poll time
      await updateLastPolled(company.id, env);
    }

    // Mark email as read
    await markEmailRead(email.id, token);
    console.log(`Email ${email.id} processed and marked as read`);

  } catch (err) {
    console.error(`Error processing email ${email.id}:`, err);
  }
}
