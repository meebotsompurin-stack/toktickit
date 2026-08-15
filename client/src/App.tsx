import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Category {
  id: number;
  name: string;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCheckSystem = async () => {
    setLoading(true);
    setStatus('Loading...');
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setStatus('System Status: Online');
      } else {
        setStatus('System Status: Offline. Unable to connect to TokTickIT API');
      }
    } catch (error) {
      setStatus('System Status: Offline. Unable to connect to TokTickIT API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>TokTickIT IT Service Desk</h2>
      
      <div className="mb-4">
        <button 
          className="btn btn-primary" 
          onClick={handleCheckSystem}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check System'}
        </button>
      </div>

      {status && (
        <div className={`alert ${status.includes('Online') ? 'alert-success' : status.includes('Loading') ? 'alert-info' : 'alert-danger'}`}>
          {status}
        </div>
      )}

      {categories.length > 0 && (
        <div className="mt-4">
          <h4>Supported Request Categories</h4>
          <ul className="list-group">
            {categories.map((category) => (
              <li key={category.id} className="list-group-item">
                {category.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
