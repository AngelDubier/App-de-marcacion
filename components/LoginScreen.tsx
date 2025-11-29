
import React, { useState } from 'react';
import { useAppContext } from '../App';
import { UserIcon, KeyIcon, LoginIcon, EyeIcon, EyeSlashIcon } from './common/Icons';

const LoginScreen = () => {
  const { login, isLoading } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(username, password);
    if (!success) {
      setError('Nombre de usuario o contraseña inválidos.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-xl shadow-lg dark:bg-slate-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">PECC-TIME</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Inicia sesión en tu cuenta</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Usuario</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon />
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 p-3 mt-1 text-gray-800 bg-slate-100 dark:bg-slate-700 dark:text-gray-200 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="ej., Alice"
                  required
                  disabled={isLoading}
                />
            </div>
          </div>
          <div>
            <label htmlFor="password"  className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Contraseña</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 p-3 mt-1 text-gray-800 bg-slate-100 dark:bg-slate-700 dark:text-gray-200 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contraseña"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div>
            <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full flex justify-center items-center gap-2 py-3 px-4 text-white font-semibold bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </>
              ) : (
                  <>
                    <LoginIcon />
                    Iniciar Sesión
                  </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
