
import React, { useState } from 'react';
import { useAppContext } from '../App';
import { User, UserRole } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from './common/Icons';

interface UserManagementProps {
  allowedRoles: UserRole[];
}

const roleTranslations: Record<string, string> = {
    employee: 'Empleado',
    contractor: 'Contratista',
    admin: 'Administrador',
};


const UserManagement = ({ allowedRoles }: UserManagementProps) => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', role: 'employee' as UserRole, password: '' });
  
  const manageableUsers = users.filter(user => user.id !== currentUser?.id);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({ name: user.name, role: user.role, password: '' });
    } else {
      setFormData({ name: '', role: 'employee', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
        // Only update password if a new one is provided
        const userToUpdate: User = { 
            ...editingUser, 
            name: formData.name, 
            role: formData.role,
            password: formData.password ? formData.password : editingUser.password
        };
      updateUser(userToUpdate);
    } else {
        if (!formData.password) {
            alert('La contraseña es obligatoria para nuevos usuarios.');
            return;
        }
      addUser({ name: formData.name, role: formData.role, password: formData.password });
    }
    handleCloseModal();
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold">Gestión de Usuarios</h3>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          <PlusIcon /> Añadir Usuario
        </button>
      </div>
      <div className="p-4">
        <ul className="space-y-2">
          {manageableUsers.map(user => (
            <li key={user.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{roleTranslations[user.role] || user.role}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                    <PencilIcon />
                </button>
                <button onClick={() => window.confirm(`¿Estás seguro de que quieres eliminar a ${user.name}?`) && deleteUser(user.id)} className="p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400">
                    <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"/>
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Rol</label>
                <select name="role" id="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                  {allowedRoles.map(role => <option key={role} value={role} className="capitalize">{roleTranslations[role] || role}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} placeholder={editingUser ? 'Dejar en blanco para mantener la actual' : ''} required={!editingUser} className="mt-1 block w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"/>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editingUser ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;