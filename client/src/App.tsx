import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

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

  return (
    <div className="container mt-5">
      <h2>TokTickIT IT Service Desk</h2>
      
      <div className="mb-4">
        <button 
          className="btn btn-primary" 
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

      <div className="mt-4">
        <h4>Supported Request Categories</h4>
        {loading ? (
          <p className="text-primary">Loading categories...</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : categories.length > 0 ? (
          <ul className="list-group">
            {categories.map((category) => (
              <li key={category.id} className="list-group-item">
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
