import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
      <button 
        className="btn btn-primary" 
        onClick={handleCheckSystem}
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Check System'}
      </button>
      {status && (
        <div className={`mt-3 alert ${status.includes('Online') ? 'alert-success' : status.includes('Loading') ? 'alert-info' : 'alert-danger'}`}>
          {status}
        </div>
      )}
    </div>
  );
}

export default App;
