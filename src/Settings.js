import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function Settings({ userRole }) {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const companySlug = userRole?.company_id ? userRole.company_id.slice(0, 8) : 'company';
  const oilEmail = `oilsamples+${companySlug}@mechiq.com.au`;
  const hasOilSampling = userRole?.company_features?.oil_sampling !== false;

  useEffect(() => {
    if (userRole?.company_id) fetchConnection();
  }, [userRole]);

  const fetchConnection = async () => {
    setLoading(false);
    // Connection record is managed server-side — just show status
    const { data } = await supabase
      .from('email_connections')
      .select('*')
      .eq('company_id', userRole.company_id)
      .eq('is_active', true)
      .single();
    setConnection(data || null);
    setLoading(false);
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect oil sampling email? New reports will stop being processed.')) return;
    setDisconnecting(true);
    await supabase.from('email_connections').update({ is_active: false }).eq('company_id', userRole.company_id);
    setConnection(null);
    setDisconnecting(false);
  };

  const infoRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E9F1FA', fontSize: '13px' }}>
      <span style={{ color: '#7a92a8', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#1a2b3c', fontWeight: 500 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: '680px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1a2b3c', margin: '0 0 4px' }}>Settings</h2>
      <p style={{ fontSize: '13px', color: '#7a92a8', margin: '0 0 28px' }}>Manage your company integrations and preferences.</p>

      {/* Oil Sampling Email Section */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #d6e6f2', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#e8f7fd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔬</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a2b3c' }}>Oil Sampling</div>
            <div style={{ fontSize: '12px', color: '#7a92a8' }}>Automatic lab report processing via AI</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {hasOilSampling
              ? <span style={{ padding: '4px 12px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>Enabled</span>
              : <span style={{ padding: '4px 12px', backgroundColor: '#E9F1FA', color: '#7a92a8', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>Not Enabled</span>
            }
          </div>
        </div>

        {hasOilSampling ? (
          <>
            {/* Unique email address */}
            <div style={{ backgroundColor: '#E9F1FA', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a92a8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Your Oil Sampling Email Address</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#00ABE4', backgroundColor: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d6e6f2' }}>
                  {oilEmail}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(oilEmail); alert('Copied to clipboard!'); }}
                  style={{ padding: '10px 16px', backgroundColor: '#00ABE4', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                  Copy
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#7a92a8', marginTop: '8px', lineHeight: 1.5 }}>
                Give this email address to your oil analysis laboratory. When they send reports to this address, MechIQ will automatically extract the data, match it to your assets, and generate AI-powered analysis within 6 hours.
              </div>
            </div>

            {/* How it works */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#3d5166', marginBottom: '8px' }}>How it works</div>
              {[
                { icon: '📧', text: 'Your lab emails the oil report PDF to your unique address' },
                { icon: '🤖', text: 'Claude AI reads the PDF and extracts all wear metals, fluid properties and condition' },
                { icon: '🔗', text: 'Results are automatically matched to the correct asset by asset number' },
                { icon: '⚠️', text: 'Critical results automatically create a Work Order for immediate action' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{icon}</span>
                  <span style={{ fontSize: '12px', color: '#3d5166', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Connection status */}
            {loading ? null : (
              <div style={{ borderTop: '1px solid #E9F1FA', paddingTop: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#7a92a8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Processing Status</div>
                {connection ? (
                  <div>
                    {infoRow('Status', <span style={{ color: '#16a34a', fontWeight: 700 }}>Active — processing emails</span>)}
                    {infoRow('Last checked', connection.last_polled_at ? new Date(connection.last_polled_at).toLocaleString() : 'Not yet polled')}
                    {infoRow('Connected', connection.connected_at ? new Date(connection.connected_at).toLocaleDateString() : '—')}
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      style={{ marginTop: '14px', padding: '8px 18px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                    >
                      {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '14px', backgroundColor: '#f8fbfd', borderRadius: '8px', border: '1px dashed #d6e6f2', fontSize: '13px', color: '#7a92a8', lineHeight: 1.6 }}>
                    Waiting for first report. As soon as your lab emails the address above, MechIQ will begin processing automatically — no additional setup required.
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '20px', backgroundColor: '#f8fbfd', borderRadius: '8px', border: '1px dashed #d6e6f2', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#7a92a8', lineHeight: 1.6 }}>
              Oil Sampling is not enabled for your account. Contact your MechIQ administrator to enable this feature.
            </div>
          </div>
        )}
      </div>

      {/* Future settings placeholder */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #d6e6f2', borderRadius: '12px', padding: '24px', opacity: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#E9F1FA', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔔</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a2b3c' }}>Notifications</div>
            <div style={{ fontSize: '12px', color: '#7a92a8' }}>Coming soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
