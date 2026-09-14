import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useStore } from '@tanstack/react-store';
import { store, storeActions } from '../store';

const Home = () => {
  const groups = useStore(store, (state) => state.groups);
  const [totals, setTotals] = useState({ paid: 0, owed: 0, net: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCurrency, setNewGroupCurrency] = useState('USD');

  useEffect(() => {
    storeActions.loadGroups();
    updateTotals();
  }, []);

  const updateTotals = async () => {
    const result = await storeActions.calculateOverallBalance();
    setTotals(result);
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    await storeActions.addGroup(newGroupName, newGroupCurrency);
    setNewGroupName('');
    setIsModalOpen(false);
    updateTotals(); // In case calculating balance depends on groups
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Splitz</h1>

      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Your Summary</h2>
        <p>Total Paid: {totals.paid / 100} {totals.net >= 0 ? 'USD' : 'USD'}</p>
        <p>Total Owed: {totals.owed / 100} USD</p>
        <h3>Net: {(totals.net / 100).toFixed(2)} USD</h3>
        <p>{totals.net >= 0 ? 'You are owed' : 'You owe'} {Math.abs(totals.net / 100).toFixed(2)} USD</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Your Groups</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          + Add Group
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {groups.map((group) => (
          <li key={group.id} style={{
            padding: '15px',
            border: '1px solid #ddd',
            margin: '10px 0',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <strong>{group.name}</strong>
            <Link to={`/group/${group.id}`} style={{ color: 'blue', textDecoration: 'none' }}>
              View Group &rarr;
            </Link>
          </li>
        ))}
      </ul>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '300px'
          }}>
            <h3>Add New Group</h3>
            <form onSubmit={handleAddGroup}>
              <div style={{ marginBottom: '15px' }}>
                <label>Group Name:</label><br />
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Home Currency:</label><br />
                <input
                  type="text"
                  value={newGroupCurrency}
                  onChange={(e) => setNewGroupCurrency(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/group/:groupId" element={<div>Group Details (TBD)</div>} />
      </Routes>
    </BrowserRouter>
  );
};
