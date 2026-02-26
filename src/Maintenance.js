import React, { useState } from 'react';

function Maintenance() {
  const [tasks, setTasks] = useState([
    { id: 1, asset: 'Excavator CAT 390', task: 'Engine Oil Change', frequency: 'Every 250 hours', nextDue: '15/03/2026', status: 'Upcoming', assignedTo: 'John S' },
    { id: 2, asset: 'Drill Rig DR750', task: 'Hydraulic Filter Replace', frequency: 'Every 500 hours', nextDue: '01/03/2026', status: 'Overdue', assignedTo: 'Mick F' },
    { id: 3, asset: 'Crusher Fixed 01', task: 'Belt Inspection', frequency: 'Monthly', nextDue: '28/02/2026', status: 'Due Soon', assignedTo: 'Steve R' },
    { id: 4, asset: 'Angle Grinder 04', task: 'Disc Replacement', frequency: 'Weekly', nextDue: '05/03/2026', status: 'Upcoming', assignedTo: 'John S' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    asset: '', task: '', frequency: '', nextDue: '', assignedTo: ''
  });

  const handleAdd = () => {
    if (newTask.asset && newTask.task && newTask.nextDue) {
      setTasks([...tasks, { ...newTask, id: tasks.length + 1, status: 'Upcoming' }]);
      setNewTask({ asset: '', task: '', frequency: '', nextDue: '', assignedTo: '' });
      setShowForm(false);
    }
  };

  const handleComplete = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
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
            <input type="date" value={newTask.nextDue}
              onChange={e => setNewTask({...newTask, nextDue: e.target.value})} />
            <input placeholder="Assigned To" value={newTask.assignedTo}
              onChange={e => setNewTask({...newTask, assignedTo: e.target.value})} />
          </div>
          <button className="btn-primary" onClick={handleAdd}>Save PM Task</button>
        </div>
      )}

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
              <td>{t.nextDue}</td>
              <td>
                <span className={`pm-status ${t.status.toLowerCase().replace(' ', '-')}`}>
                  {t.status}
                </span>
              </td>
              <td>{t.assignedTo}</td>
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
    </div>
  );
}

export default Maintenance;