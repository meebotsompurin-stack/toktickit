import React, { useState } from 'react';

interface Props {
  onLogin: (id: string) => void;
}

export const DevRequesterSelector: React.FC<Props> = ({ onLogin }) => {
  const [id, setId] = useState(localStorage.getItem('requesterId') || '');

  const handleLogin = () => {
    if (id.trim() !== '') {
      localStorage.setItem('requesterId', id);
      onLogin(id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-zenPrimary mb-4">Dev Requester Selection</h3>
      <p className="text-gray-600 mb-4 text-sm">
        (Mock Login) Please enter your Requester ID to continue testing the application.
      </p>
      <div className="flex gap-2">
        <input 
          type="text"
          className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-zenPrimary focus:ring-1 focus:ring-zenPrimary"
          value={id} 
          onChange={e => setId(e.target.value)} 
          placeholder="Enter Requester ID" 
        />
        <button 
          className="bg-zenPrimary hover:bg-zenSecondary text-white px-4 py-2 rounded transition-colors"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
};
