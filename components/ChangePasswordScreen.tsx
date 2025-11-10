
import React, { useState } from 'react';
import { useAppContext } from '../App';
import { KeyIcon } from './common/Icons';

const ChangePasswordScreen = () => {
  const { currentUser, updatePassword, logout } = useAppContext();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
    }
    setError('');
    updatePassword(newPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg dark:bg-slate-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Cambia tu Contraseña</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Por razones de seguridad, debes cambiar tu contraseña temporal, {currentUser?.name}.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="newPassword"  className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Nueva Contraseña</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyIcon />
                </span>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 p-3 mt-1 text-gray-800 bg-slate-100 dark:bg-slate-700 dark:text-gray-200 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nueva Contraseña"
                  required
                />
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword"  className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Confirmar Nueva Contraseña</label>
             <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyIcon />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 p-3 mt-1 text-gray-800 bg-slate-100 dark:bg-slate-700 dark:text-gray-200 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Confirmar Contraseña"
                  required
                />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex flex-col gap-3">
            <button type="submit" className="w-full py-3 px-4 text-white font-semibold bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900">
              Actualizar Contraseña
            </button>
             <button type="button" onClick={logout} className="w-full py-2 px-4 text-slate-700 dark:text-slate-300 font-medium bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
              Cerrar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordScreen;