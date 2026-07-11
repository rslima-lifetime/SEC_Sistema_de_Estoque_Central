import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { EstoqueCentral } from './pages/EstoqueCentral';
import { Movimentacoes } from './pages/Movimentacoes';
import { Distribuicao } from './pages/Distribuicao';
import { Auditoria } from './pages/Auditoria';
import { Producao } from './pages/Producao';
import { Login } from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('sec_auth') === 'true';
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLoginSuccess = (email: string) => {
    sessionStorage.setItem('sec_auth', 'true');
    sessionStorage.setItem('sec_user_email', email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sec_auth');
    sessionStorage.removeItem('sec_user_email');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'stock':
        return <EstoqueCentral />;
      case 'movements':
        return <Movimentacoes />;
      case 'production':
        return <Producao />;
      case 'distribution':
        return <Distribuicao />;
      case 'audit':
        return <Auditoria />;
      default:
        return <Dashboard />;
    }
  };

  const userEmail = sessionStorage.getItem('sec_user_email') || 'admin@vacaburguer.com';

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} userEmail={userEmail}>
      {renderContent()}
    </Layout>
  );
}

export default App;
