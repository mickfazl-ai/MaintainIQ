import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function Maintenance() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    asset: '', task: '', frequency: '', next_due: '', assigned_to: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Error:', error);
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (newTask.asset && newTask.task && newTask.next_due) {
      const { error } = await supabase
        .from('maintenance')
        .insert([{ ...newTask, status: 'Upcoming' }]);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        fetchTasks();
        setNewTask({ asset: '', task: '', frequency: '', next_due: '', assigned_to: '' });
        setShowForm(false);
      }
    }
  };

  const handleComplete = async (id) => {
    const { error } = await supabase
      .from('maintenance')
      .update({ status: 'Completed' })
      .eq('id', id);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      fetchTasks();
    }
  };

  return (
    <div className="maintenance">
      <div className="page-header">
        <h2>Preventative Maintenance</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Add PM Task
        </button>
      </div>

      <div className="pm-summary">
        <div className="pm-badge overdue-count">
          Overdue: {tasks.filter(t => t.status === 'Overdue').length}
        </div>
        <div className="pm-badge duesoon-count">
          Due Soon: {tasks.filter(t => t.status === 'Due Soon').length}
        </div>
        <div className="pm-badge upcoming-count">
          Upcoming: {tasks.filter(t => t.status === 'Upcoming').length}
        </div>
        <div className="pm-badge completed-count">
          Completed: {tasks.filter(t => t.status === 'Completed').length}
        </div>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Add New PM Task</h3>
          <div className="form-grid">
            <input placeholder="Asset Name" value={newTask.asset}
              onChange={e => setNewTask({...newTask, asset: e.target.value})} />
            <input placeholder="Task Description" value={newTask.task}
              onChange={e => setNewTask({...newTask, task: e.target.value})} />
            <select value={newTask.frequency}
              onChange={e => setNewTask({...newTask, frequency: e.target.value})}>
              <option value="">Select Frequency</option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Every 250 hours</option>
              <option>Every 500 hours</option>
              <option>Every 1000 hours</option>
              <option>Annually</option>
            </select>
            <input type="date" value={newTask.next_due}
              onChange={e => setNewTask({...newTask, next_due: e.target.value})} />
            <input placeholder="Assigned To" value={newTask.assigned_to}
              onChange={e => setNewTask({...newTask, assigned_to: e.target.value})} />
          </div>
          <button className="btn-primary" onClick={handleAdd}>Save PM Task</button>
        </div>
      )}

      {loading ? (
        <p style={{color: '#a8a8b3'}}>Loading maintenance tasks...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Task</th>
              <th>Frequency</th>
              <th>Next Due</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td>{t.asset}</td>
                <td>{t.task}</td>
                <td>{t.frequency}</td>
                <td>{t.next_due}</td>
                <td>
                  <span className={`pm-status ${t.status.toLowerCase().replace(' ', '-')}`}>
                    {t.status}
                  </span>
                </td>
                <td>{t.assigned_to}</td>
                <td>
                  {t.status !== 'Completed' && (
                    <button className="btn-complete" onClick={() => handleComplete(t.id)}>
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Maintenance;