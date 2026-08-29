import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MyTickets } from './components/MyTickets';
import { DevRequesterSelector } from './components/DevRequesterSelector';

interface Category {
  id: number;
  name: string;
}

function App() {
  const [healthLoading, setHealthLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // จัดการ State ของการ Login จำลอง
  const [loggedInRequester, setLoggedInRequester] = useState<string | null>(
    localStorage.getItem('requesterId')
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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
      setStatus('System Status: Offline. Unable to connect to TokTickIT API');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('requesterId');
    setLoggedInRequester(null);
  };

  return (
    <div className="container mt-5 font-sans bg-zenBg min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-zenPrimary">TokTickIT IT Service Desk</h2>
        {loggedInRequester && (
          <button 
            className="btn btn-outline-danger btn-sm"
            onClick={handleLogout}
          >
            Logout ({loggedInRequester})
          </button>
        )}
      </div>
      
      <div className="mb-4">
        <button 
          className="btn text-white bg-zenPrimary hover:bg-zenSecondary" 
          onClick={handleCheckSystem}
          disabled={healthLoading}
        >
          {healthLoading ? 'Checking...' : 'Check System'}
        </button>
      </div>

      {status && (
        <div className={`alert ${status.includes('Online') ? 'alert-success' : status.includes('Loading') ? 'alert-info' : 'alert-danger'}`}>
          {status}
        </div>
      )}

      {!loggedInRequester ? (
        <DevRequesterSelector onLogin={setLoggedInRequester} />
      ) : (
        <div className="dashboard-content">
          <MyTickets />
        </div>
      )}

      {/* ซ่อนหมวดหมู่ไว้ด้านล่างชั่วคราว หรือปรับให้สวยงามภายหลัง */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <h4 className="text-lg font-semibold text-gray-700">Supported Request Categories</h4>
        {loading ? (
          <p className="text-zenPrimary">Loading categories...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : categories.length > 0 ? (
          <ul className="list-group max-w-md mt-2">
            {categories.map((category) => (
              <li key={category.id} className="list-group-item text-gray-800">
                {category.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No categories found.</p>
        )}
      </div>
    </div>
  );
}

export default App;
