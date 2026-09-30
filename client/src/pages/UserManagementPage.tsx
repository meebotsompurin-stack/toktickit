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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR'>('REQUESTER');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/admin/users');
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
      await apiFetch(`/api/admin/users/${userId}`, {
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
      await apiFetch(`/api/admin/users/${userId}`, {
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
      await apiFetch(`/api/admin/users/${userId}/password`, {
        method: 'PATCH',
      });
      alert('Password reset successfully.');
    } catch (err: any) {
      alert(`Error resetting password: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const createdUser = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      setUsers((prev) => [...prev, createdUser]);
      setShowCreateModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('REQUESTER');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading users...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  const roleColors = {
    ADMINISTRATOR: 'bg-purple-100 text-purple-800 border-purple-200',
    IT_STAFF: 'bg-blue-100 text-blue-800 border-blue-200',
    REQUESTER: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="bg-white rounded shadow-sm border border-zenPale p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-zenPrimary">User Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-zenPrimary text-white px-4 py-2 rounded font-semibold hover:bg-zenSecondary transition-colors shadow-sm"
        >
          + Create User
        </button>
      </div>
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
                      className={`border rounded-full px-3 py-1 font-semibold text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 ${roleColors[u.role]} ${isSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={isSelf}
                      style={{ textAlignLast: 'center' }}
                    >
                      <option value="REQUESTER" className="bg-white text-gray-800">REQUESTER</option>
                      <option value="IT_STAFF" className="bg-white text-gray-800">IT_STAFF</option>
                      <option value="ADMINISTRATOR" className="bg-white text-gray-800">ADMINISTRATOR</option>
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-zenPrimary mb-4">Create New User</h3>
            {createError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 focus:border-zenPrimary"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 focus:border-zenPrimary"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 focus:border-zenPrimary"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-zenPrimary/50 focus:border-zenPrimary bg-white"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                >
                  <option value="REQUESTER">REQUESTER</option>
                  <option value="IT_STAFF">IT_STAFF</option>
                  <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-1/2 bg-zenPrimary text-white font-semibold py-2 px-4 rounded hover:bg-zenSecondary transition-colors disabled:opacity-70"
                >
                  {isCreating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
