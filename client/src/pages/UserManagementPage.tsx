import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../contexts/AuthContext';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';
  requiresPasswordChange: boolean;
  isActive: boolean;
}

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/users');
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiFetch(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
      );
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('Are you sure you want to reset this user\'s password to \'password123\'? They will be forced to change it on their next login.')) {
      return;
    }
    try {
      await apiFetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
      });
      alert('Password reset successfully.');
    } catch (err: any) {
      alert(`Error resetting password: ${err.message}`);
    }
  };

  if (loading) return <div className="text-center py-10">Loading users...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded shadow-sm border border-zenPale p-6">
      <h2 className="text-xl font-bold text-zenPrimary mb-6">User Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-zenPale font-semibold text-gray-600 bg-zenBg">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className="border-b border-zenPale hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      className={`border border-gray-300 rounded px-2 py-1 focus:ring-zenPrimary focus:border-zenPrimary ${isSelf ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={isSelf}
                    >
                      <option value="REQUESTER">REQUESTER</option>
                      <option value="IT_STAFF">IT_STAFF</option>
                      <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleStatusToggle(u.id, u.isActive)}
                      disabled={isSelf}
                      className={`px-3 py-1 rounded text-white font-semibold text-xs ${
                        u.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                      } ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      disabled={isSelf}
                      className={`px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-semibold shadow-sm transition-colors ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
