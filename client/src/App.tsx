import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MyTickets } from './components/MyTickets';
import { DevRequesterSelector } from './components/DevRequesterSelector';
import { CreateTicket } from './components/CreateTicket';
import { TicketDetail } from './components/TicketDetail';

interface Requester {
  id: string;
  name: string;
}

function App() {
  const [healthLoading, setHealthLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  
  const getInitialRequester = (): Requester | null => {
    const saved = localStorage.getItem('toktickit_requester');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  
  const [loggedInRequester, setLoggedInRequester] = useState<Requester | null>(getInitialRequester());
  
  const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const handleCheckSystem = async () => {
    setHealthLoading(true);
    setStatus('Loading...');
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
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
            <svg className="w-8 h-8 text-zenPrimary" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"></path></svg>
            <h1 className="text-2xl font-black text-zenPrimary tracking-tight">TokTick<span className="text-zenSecondary">IT</span></h1>
          </div>
          
          <div className="flex space-x-4 items-center">
            <button 
              onClick={handleCheckSystem} 
              disabled={healthLoading}
              className="text-sm px-4 py-2 border border-zenPrimary text-zenPrimary hover:bg-zenPale rounded-full transition-colors font-medium flex items-center space-x-1"
            >
              <span>{healthLoading ? 'Checking...' : 'Check System'}</span>
            </button>
            {loggedInRequester && (
              <button 
                className="text-sm text-gray-500 hover:text-red-500 font-semibold"
                onClick={() => {
                  localStorage.removeItem('toktickit_requester');
                  setLoggedInRequester(null);
                  setView('LIST');
                }}
              >
                Logout ({loggedInRequester.name})
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

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Simulate Login (Dev Mode)</h2>
            <DevRequesterSelector 
              onSelect={(req) => {
                setLoggedInRequester(req);
                setView('LIST');
              }} 
            />
          </div>
          
          {loggedInRequester && view === 'LIST' && (
            <button 
              className="px-4 py-2 rounded font-semibold text-white bg-zenPrimary hover:bg-zenSecondary shadow-md transition-colors shrink-0"
              onClick={() => setView('CREATE')}
            >
              + Create New Ticket
            </button>
          )}
        </div>

        {!loggedInRequester ? (
          <div className="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <p className="text-gray-500 font-medium">Please select a requester above to continue.</p>
          </div>
        ) : (
          <div>
            {view === 'LIST' && <MyTickets onView={handleViewTicket} />}
            {view === 'CREATE' && <CreateTicket onCancel={() => setView('LIST')} onSuccess={handleCreateSuccess} />}
            {view === 'DETAIL' && selectedTicketId && (
              <TicketDetail ticketId={selectedTicketId} onBack={() => setView('LIST')} />
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
