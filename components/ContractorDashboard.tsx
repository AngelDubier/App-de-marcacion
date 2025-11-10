
import React, { useState } from 'react';
import { useAppContext } from '../App';
import { DocumentTextIcon, LogoutIcon } from './common/Icons';

const ContractorDashboard = () => {
  const { currentUser, contractorSubmissions, addContractorSubmission, logout } = useAppContext();
  const [employeeName, setEmployeeName] = useState('');
  const [cedula, setCedula] = useState('');
  const [obra, setObra] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    const submission = {
      contractorId: currentUser.id,
      employeeName,
      cedula,
      obra,
      hoursWorked: parseFloat(hoursWorked),
      dailyRate: parseFloat(dailyRate),
      submissionDate: new Date(),
    };
    
    addContractorSubmission(submission);
    
    // Reset form
    setEmployeeName('');
    setCedula('');
    setObra('');
    setHoursWorked('');
    setDailyRate('');
    setIsSubmitting(false);
    alert('¡Envío exitoso!');
  };
  
  const userSubmissions = contractorSubmissions.filter(s => s.contractorId === currentUser?.id).sort((a,b) => b.submissionDate.getTime() - a.submissionDate.getTime());

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Bienvenido, {currentUser?.name}</h1>
                <p className="text-slate-500 dark:text-slate-400">Panel de Contratista</p>
            </div>
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900">
                <LogoutIcon />
                Cerrar Sesión
            </button>
        </header>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><DocumentTextIcon /> Enviar Registro de Trabajo</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="employeeName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Empleado</label>
              <input type="text" id="employeeName" value={employeeName} onChange={e => setEmployeeName(e.target.value)} required className="mt-1 block w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="cedula" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cédula del Empleado</label>
              <input type="text" id="cedula" value={cedula} onChange={e => setCedula(e.target.value)} required className="mt-1 block w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
             <div>
              <label htmlFor="obra" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Obra o Proyecto</label>
              <input type="text" id="obra" value={obra} onChange={e => setObra(e.target.value)} required className="mt-1 block w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="hoursWorked" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Total de Horas Trabajadas</label>
              <input type="number" id="hoursWorked" value={hoursWorked} onChange={e => setHoursWorked(e.target.value)} required min="0" step="0.1" className="mt-1 block w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="dailyRate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tarifa de Pago Diario ($)</label>
              <input type="number" id="dailyRate" value={dailyRate} onChange={e => setDailyRate(e.target.value)} required min="0" step="0.01" className="mt-1 block w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3 px-6 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition-colors">
              {isSubmitting ? 'Enviando...' : 'Enviar Registro'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Tus Envíos</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {userSubmissions.length > 0 ? userSubmissions.map(s => (
                    <div key={s.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <p className="font-semibold">{s.employeeName} - C.C. {s.cedula}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Obra: {s.obra}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {s.hoursWorked} hrs @ ${s.dailyRate}/día el {s.submissionDate.toLocaleDateString()}
                        </p>
                    </div>
                )) : <p className="text-center text-slate-500 dark:text-slate-400 pt-10">Aún no hay envíos.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorDashboard;