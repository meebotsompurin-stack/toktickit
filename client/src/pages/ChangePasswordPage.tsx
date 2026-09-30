import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { fetchMe, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleCancel = () => {
    if (user?.requiresPasswordChange) {
      logout();
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    const token = localStorage.getItem('toktickit_token');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        await fetchMe(); // Refresh user state to clear requiresPasswordChange flag
        navigate('/', { replace: true });
      } else {
        setError(data.message || 'Failed to change password. Please check your current password.');
      }
    } catch (err) {
      setError('An error occurred while changing the password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zenBg p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-zenPale max-w-md w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-zenPrimary tracking-tight">Change Password</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {user?.requiresPasswordChange 
              ? 'For security reasons, you must change your initial password before accessing TokTickIT.' 
              : 'Update your account password below.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
            <input 
              type="password" 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 focus:border-zenPrimary"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
            <input 
              type="password" 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 focus:border-zenPrimary"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
            <input 
              type="password" 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 focus:border-zenPrimary"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button 
              type="button" 
              onClick={handleCancel}
              className="w-1/2 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-1/2 bg-zenPrimary text-white font-semibold py-2 px-4 rounded hover:bg-zenSecondary transition-colors disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
