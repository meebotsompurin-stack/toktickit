import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MyTickets } from './components/MyTickets';
import { CreateTicket } from './components/CreateTicket';
import { TicketDetail } from './components/TicketDetail';
import { StaffDashboard } from './components/StaffDashboard';
import { RequesterDashboard } from './components/RequesterDashboard';
import { useAuth } from './contexts/AuthContext';
import { UserManagementPage } from './pages/UserManagementPage';
import { StaffQueuePage } from './pages/StaffQueuePage';
import { apiFetch } from './api';

function App() {
  const { user, logout } = useAuth();
  const [healthLoading, setHealthLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  
  const [view, setView] = useState<'LIST' | 'DASHBOARD' | 'CREATE' | 'DETAIL' | 'USER_MANAGEMENT' | 'STAFF_QUEUE'>('LIST');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [queueFilters, setQueueFilters] = useState<any>(null);

  const handleCheckSystem = async () => {
    setHealthLoading(true);
    setStatus('Loading...');
    try {
      const response = await apiFetch('/api/health');
      if (response && response.status === 'ok') {
        setStatus('System Status: Online');
      } else {
        setStatus('System Status: Offline. Unable to connect to TokTickIT API');
      }
    } catch (err) {
      console.error('Error checking system health:', err);
      setStatus('System Status: Offline. Unable to connect to TokTickIT API');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    alert('Ticket created successfully!');
    setView('LIST');
  };

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setView('DETAIL');
  };

  return (
    <div className="min-h-screen bg-zenBg text-gray-800 font-sans flex flex-col">
      <header className="bg-white shadow-sm border-b border-zenPale p-4 sticky top-0 z-10 shrink-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('LIST')}>
            <svg className="w-8 h-8 text-zenPrimary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"></path>
            </svg>
            <h1 className="text-2xl font-black text-zenPrimary tracking-tight">TokTick<span className="text-zenSecondary">IT</span></h1>
          </div>
          
          <div className="flex space-x-4 items-center">
            {user && (
              <button 
                onClick={() => setView('DASHBOARD')}
                className={`text-sm font-semibold transition-colors ${view === 'DASHBOARD' ? 'text-zenSecondary border-b-2 border-zenSecondary' : 'text-zenPrimary hover:text-zenSecondary'}`}
              >
                Dashboard
              </button>
            )}
            {user && (
              <button 
                onClick={() => setView('LIST')}
                className={`text-sm font-semibold transition-colors ${view === 'LIST' ? 'text-zenSecondary border-b-2 border-zenSecondary' : 'text-zenPrimary hover:text-zenSecondary'}`}
              >
                My Tickets
              </button>
            )}
            {user && (user.role === 'IT_STAFF' || user.role === 'ADMINISTRATOR') && (
              <button 
                onClick={() => {
                  setQueueFilters(null);
                  setView('STAFF_QUEUE');
                }}
                className={`text-sm font-semibold transition-colors ${view === 'STAFF_QUEUE' ? 'text-zenSecondary border-b-2 border-zenSecondary' : 'text-zenPrimary hover:text-zenSecondary'}`}
              >
                Staff Queue
              </button>
            )}
            {user && user.role === 'ADMINISTRATOR' && (
              <button 
                onClick={() => setView('USER_MANAGEMENT')}
                className={`text-sm font-semibold transition-colors ${view === 'USER_MANAGEMENT' ? 'text-zenSecondary border-b-2 border-zenSecondary' : 'text-zenPrimary hover:text-zenSecondary'}`}
              >
                User Management
              </button>
            )}
            <button 
              onClick={handleCheckSystem} 
              disabled={healthLoading}
              className="text-sm px-4 py-2 border border-zenPrimary text-zenPrimary hover:bg-zenPale rounded-full transition-colors font-medium flex items-center space-x-1"
            >
              <span>{healthLoading ? 'Checking...' : 'Check System'}</span>
            </button>
            {user && (
              <button 
                className="text-sm text-gray-500 hover:text-red-500 font-semibold"
                onClick={logout}
              >
                Logout ({user.name})
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="p-4 max-w-5xl mx-auto w-full flex-grow">
        
        {status && (
          <div className={`mb-6 p-3 rounded shadow-sm text-sm font-semibold border ${status.includes('Online') ? 'bg-zenPale text-zenPrimary border-zenPrimary/20' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {status}
          </div>
        )}

        <div className="mb-6 flex justify-end">
          {user && user.role === 'REQUESTER' && (view === 'LIST' || view === 'DASHBOARD') && (
            <button 
              className="px-4 py-2 rounded font-semibold text-white bg-zenPrimary hover:bg-zenSecondary shadow-md transition-colors shrink-0"
              onClick={() => setView('CREATE')}
            >
              + Create New Ticket
            </button>
          )}
        </div>

        <div>
          {view === 'DASHBOARD' && (
            user && (user.role === 'IT_STAFF' || user.role === 'ADMINISTRATOR') ? (
              <StaffDashboard
                onNavigate={(v, filter) => {
                  if (v === 'queue') {
                    setQueueFilters(filter || null);
                    setView('STAFF_QUEUE');
                  } else if (v === 'user-management') {
                    setView('USER_MANAGEMENT');
                  } else {
                    setView('LIST');
                  }
                }}
                onSelectTicket={handleViewTicket}
              />
            ) : (
              <RequesterDashboard
                onNavigate={(v) => setView(v === 'create' ? 'CREATE' : 'LIST')}
                onSelectTicket={handleViewTicket}
                onCreateTicket={() => setView('CREATE')}
              />
            )
          )}
          {view === 'LIST' && <MyTickets onView={handleViewTicket} />}
          {view === 'CREATE' && <CreateTicket onCancel={() => setView('LIST')} onSuccess={handleCreateSuccess} />}
          {view === 'DETAIL' && selectedTicketId && (
            <TicketDetail ticketId={selectedTicketId} onBack={() => setView('LIST')} />
          )}
          {view === 'USER_MANAGEMENT' && <UserManagementPage />}
          {view === 'STAFF_QUEUE' && (
            <StaffQueuePage
              onView={handleViewTicket}
              initialFilter={queueFilters}
              initialFilters={queueFilters}
            />
          )}
        </div>

      </main>
    </div>
  );
}

export default App;
