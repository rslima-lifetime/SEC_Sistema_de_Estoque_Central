import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  Truck, 
  ClipboardCheck, 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  AlertTriangle,
  LogOut,
  Factory,
  Key,
  CheckCircle2
} from 'lucide-react';
import { dbService } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userEmail?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, userEmail = 'admin@vacaburguer.com' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMock, setIsMock] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsMock(dbService.isMock());
  }, []);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (newPassword.length < 6) {
      setModalError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setModalError('As senhas não coincidem.');
      return;
    }

    try {
      await dbService.changePassword(newPassword);
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setToastMessage('Senha alterada com sucesso!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || 'Erro ao alterar a senha.');
    }
  };

  const userInitials = userEmail.split('@')[0].slice(0, 2).toUpperCase() || 'TC';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock', label: 'Estoque Central', icon: Package },
    { id: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'production', label: 'Central de Produção', icon: Factory },
    { id: 'distribution', label: 'Distribuição', icon: Truck },
    { id: 'audit', label: 'Auditoria', icon: ClipboardCheck },
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-[#212529] overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300 z-30 relative ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Floating border toggle button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full flex items-center justify-center shadow-sm z-40 transition-all hover:bg-gray-50 active:scale-95 cursor-pointer"
          title={isSidebarOpen ? "Recolher Menu" : "Expandir Menu"}
        >
          {isSidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Sidebar Header & Brand */}
        <div>
          <div className={`h-20 flex items-center px-4 border-b border-gray-100 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <img 
                src="/vaca_logo.png" 
                alt="Vaca Burguer Logo" 
                className={`${isSidebarOpen ? 'h-16 w-16' : 'h-12 w-12'} rounded-xl object-cover border-2 border-accent-yellow shadow-sm flex-shrink-0 transition-all duration-300`}
              />
              {isSidebarOpen && (
                <div className="flex flex-col select-none">
                  <span className="font-black text-xl text-gray-900 leading-none tracking-wider">SEC</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Estoque Central</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-accent-yellow bg-opacity-15 text-gray-900 font-semibold' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {/* Yellow active stripe on active item */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-accent-yellow rounded-r-lg" />
                  )}
                  
                  <Icon 
                    size={20} 
                    className={`transition-colors flex-shrink-0 ${
                      isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'
                    }`} 
                  />
                  
                  {isSidebarOpen && (
                    <span className="text-sm truncate">{item.label}</span>
                  )}
                  
                  {/* Tooltip when collapsed */}
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50 shadow-md">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100">
          {!isSidebarOpen ? (
            <div className="flex flex-col items-center space-y-2">
              <button 
                onClick={onLogout}
                className="w-full flex justify-center p-2 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-colors"
                title="Sair do Painel"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <button 
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors text-xs font-bold"
              >
                <LogOut size={16} />
                <span>Sair do Painel</span>
              </button>

              {/* Database status banner */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs ${
                isMock 
                  ? 'bg-amber-50 border-amber-200 text-amber-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {isMock ? (
                  <>
                    <Database size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="truncate">Modo Simulador Local</span>
                  </>
                ) : (
                  <>
                    <Database size={14} className="text-emerald-500 flex-shrink-0" />
                    <span className="truncate">Firestore Conectado</span>
                  </>
                )}
              </div>
              <div className="text-center text-[10px] text-gray-400">
                Torre de Controle v1.0.0
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 capitalize">
              {menuItems.find(i => i.id === activeTab)?.label || 'Sistema'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Quick Stats or status */}
            <div className="hidden md:flex items-center space-x-1 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Torre de Controle</span>
              <span>•</span>
              <span>Backoffice</span>
            </div>
            
            {/* User Profile Info Dropdown Container */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-xl transition-all border border-transparent hover:border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xs border border-amber-500/20 shadow-sm uppercase">
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left animate-in fade-in duration-200">
                  <div className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{userEmail.split('@')[0]}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Painel SEC</div>
                </div>
              </button>

              {isProfileOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                  
                  <div className="absolute right-0 top-12 mt-1 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-40 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-gray-50">
                      <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Acesso SEC</p>
                      <p className="text-xs font-bold text-gray-800 truncate mt-0.5" title={userEmail}>{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsPasswordModalOpen(true);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors font-medium text-left"
                      >
                        <Key size={14} className="text-gray-400" />
                        <span>Alterar Senha</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50/50 transition-colors font-bold text-left"
                      >
                        <LogOut size={14} className="text-rose-500" />
                        <span>Sair do Painel</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Database Notice Bar (Only when Mock mode is active) */}
        {isMock && (
          <div className="bg-amber-500 text-white px-8 py-2 text-xs font-medium flex items-center justify-between shadow-sm z-10 animate-pulse">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={14} />
              <span>
                <strong>Aviso:</strong> Executando em Modo Simulador (LocalStorage). Configure o Firebase no arquivo <code>.env</code> para integrar com o banco de dados de produção.
              </span>
            </div>
          </div>
        )}

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border bg-emerald-50 border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                <Key size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Alterar Senha</h3>
                <p className="text-xs text-gray-500">Defina uma nova senha para sua conta.</p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold mb-4 leading-normal">
                {modalError}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nova Senha</label>
                <input 
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Confirmar Nova Senha</label>
                <input 
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setModalError(null);
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent-yellow hover:brightness-95 text-gray-900 font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
