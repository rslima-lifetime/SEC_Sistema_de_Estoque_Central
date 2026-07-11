import React, { useState } from 'react';
import { Mail, Lock, ShieldAlert, Eye, EyeOff, CheckCircle2, UserPlus, ArrowLeft } from 'lucide-react';
import { dbService } from '../services/db';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  // Mode toggler
  const [isRegistering, setIsRegistering] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Switch modes and clear alerts
  const handleModeSwitch = (registerMode: boolean) => {
    setIsRegistering(registerMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  // Handle Form Submission (Login or Register)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email.trim() || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (isRegistering) {
      // Sign Up validation
      if (password.length < 6) {
        setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem. Digite novamente.');
        setLoading(false);
        return;
      }

      try {
        await dbService.registerUser(email, password);
        setSuccessMsg('Cadastro realizado com sucesso! Use as credenciais criadas para logar.');
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
        setLoading(false);
      } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
          setErrorMsg('Este e-mail já está cadastrado.');
        } else if (error.code === 'auth/invalid-email') {
          setErrorMsg('Formato de e-mail inválido.');
        } else {
          setErrorMsg(error.message || 'Erro ao registrar acesso. Tente novamente.');
        }
        setLoading(false);
      }
    } else {
      // Login validation
      try {
        const isAuth = await dbService.loginUser(email, password);
        if (isAuth) {
          setSuccess(true);
          setTimeout(() => {
            onLoginSuccess(email);
          }, 800);
        } else {
          setLoading(false);
          setErrorMsg('E-mail ou senha incorretos.');
        }
      } catch (error: any) {
        console.error(error);
        setLoading(false);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          setErrorMsg('E-mail ou senha incorretos.');
        } else if (error.code === 'auth/invalid-email') {
          setErrorMsg('Formato de e-mail inválido.');
        } else {
          setErrorMsg('E-mail ou senha incorretos ou não cadastrados no Firebase.');
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-[#212529] font-sans overflow-hidden">
      {/* Esquerda: Painel de Apresentação da Marca (Apenas Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-neutral-900 text-white relative overflow-hidden flex-col justify-between p-16 select-none">
        {/* Decorative subtle background gradient */}
        <div className="absolute inset-0 bg-radial-gradient from-yellow-500/10 via-transparent to-transparent opacity-60 z-0" />
        
        {/* Top Header */}
        <div className="flex items-center space-x-4 z-10">
          <img 
            src="/vaca_logo.png" 
            alt="Vaca Burguer Logo" 
            className="h-20 w-20 rounded-2xl object-cover border-2 border-accent-yellow shadow-md flex-shrink-0"
          />
          <div className="flex flex-col justify-center">
            <span className="font-black text-3xl leading-none tracking-wider text-accent-yellow">SEC</span>
            <span className="text-[11px] text-gray-300 font-bold tracking-widest uppercase mt-2">Sistema de Estoque Central VACA Burguer</span>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-6 max-w-lg z-10 my-auto">
          <span className="bg-accent-yellow bg-opacity-20 border border-accent-yellow border-opacity-30 text-accent-yellow text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-widest">
            Torre de Controle
          </span>
          <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight mt-4">
            Centralize. Monitore. <br />
            Controle. <span className="text-accent-yellow">VACA SEC.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Centralize o estoque e gerencie a produção de todas as unidades da VACA Burguer em um único painel de controle.
          </p>
        </div>

        {/* Footer */}
        <div className="z-10 text-xs text-gray-500 flex items-center justify-between border-t border-white/5 pt-6">
          <span>© 2026 Vaca Burguer Central</span>
          <span className="bg-white/5 px-2.5 py-1 rounded-md">v1.0.0</span>
        </div>
      </div>

      {/* Direita: Formulário de Login / Registro */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 relative bg-white">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
          
          {/* Logo Vaca Burguer (Mobile/Tablet Only) */}
          <div className="flex lg:hidden items-center justify-center space-x-4 mb-10">
            <img 
              src="/vaca_logo.png" 
              alt="Vaca Burguer Logo" 
              className="h-16 w-16 rounded-2xl object-cover border-2 border-accent-yellow shadow-md flex-shrink-0"
            />
            <div className="flex flex-col justify-center text-left">
              <span className="font-black text-2xl text-gray-900 leading-none tracking-wider">SEC</span>
              <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1.5">Sistema de Estoque Central</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isRegistering ? 'Criar Novo Acesso no SEC' : 'Faça seu login no SEC'}
            </h2>
            <p className="text-sm text-gray-500">
              {isRegistering 
                ? 'Crie credenciais exclusivas para acessar o sistema.' 
                : 'Acesse sua conta corporativa para gerenciar o sistema.'}
            </p>
          </div>

          {/* Alert Error Box */}
          {errorMsg && (
            <div className="flex items-start space-x-2.5 p-4 bg-rose-50 border border-rose-100 text-rose-900 rounded-2xl text-xs leading-relaxed animate-shake">
              <ShieldAlert size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Alert Success Box */}
          {successMsg && (
            <div className="flex items-start space-x-2.5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-2xl text-xs leading-relaxed">
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login or Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  placeholder="admin@vacaburguer.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || success}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="No mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || success}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Register Mode Only) */}
            {isRegistering && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repita a senha digitada"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || success}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
                success 
                  ? 'bg-emerald-500 text-white shadow-emerald-200' 
                  : 'bg-accent-yellow hover:bg-yellow-400 text-gray-900 active:scale-[0.98]'
              } disabled:opacity-75`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle2 size={18} className="animate-bounce" />
                  <span>Acesso Autorizado!</span>
                </>
              ) : (
                <span>{isRegistering ? 'Criar Novo Acesso' : 'Entrar'}</span>
              )}
            </button>
          </form>

          {/* Divider and Toggle Mode Button */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-[10px] uppercase font-bold tracking-wider">ou</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <div className="text-center">
            {isRegistering ? (
              <button
                type="button"
                onClick={() => handleModeSwitch(false)}
                className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-950 transition-colors space-x-1.5"
              >
                <ArrowLeft size={14} />
                <span>Voltar para tela de login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleModeSwitch(true)}
                className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-955 transition-colors space-x-1.5"
              >
                <UserPlus size={14} />
                <span>Criar Nova Conta / Esqueci a Senha</span>
              </button>
            )}
          </div>



        </div>
      </div>
    </div>
  );
};
