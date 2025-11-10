
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import { TimeEntry, LocationInfo } from '../types';
import { getLocationInfo } from '../services/geminiService';
import { ClockIcon, LocationMarkerIcon, PlusCircleIcon, LogoutIcon } from './common/Icons';

const EmployeeDashboard = () => {
  const { currentUser, timeEntries, addTimeEntry, updateTimeEntry, logout } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overtimeHours, setOvertimeHours] = useState('');
  
  const userTimeEntries = timeEntries.filter(entry => entry.userId === currentUser?.id).sort((a,b) => b.clockIn.getTime() - a.clockIn.getTime());
  const currentEntry = userTimeEntries.find(entry => !entry.clockOut);

  const handleClock = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      const locationDetails = await getLocationInfo(latitude, longitude);

      const locationInfo: LocationInfo = {
        latitude,
        longitude,
        description: locationDetails.description,
        mapUri: locationDetails.mapUri,
      };

      if (currentEntry) {
        const updatedEntry = { ...currentEntry, clockOut: new Date(), clockOutLocation: locationInfo };
        updateTimeEntry(updatedEntry);
      } else {
        const newEntry: Omit<TimeEntry, 'id'> = {
          userId: currentUser!.id,
          userName: currentUser!.name,
          clockIn: new Date(),
          clockInLocation: locationInfo,
        };
        addTimeEntry(newEntry);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Error: ${err.message}. Por favor, asegúrate de que los servicios de ubicación estén activados.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOvertimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(overtimeHours);
    if (currentEntry && hours > 0) {
      updateTimeEntry({ ...currentEntry, overtimeHours: (currentEntry.overtimeHours || 0) + hours });
      setOvertimeHours('');
      alert(`${hours} horas extra añadidas correctamente.`);
    } else {
      alert('Debes estar fichado para añadir horas extra.');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
       <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Bienvenido, {currentUser?.name}</h1>
                <p className="text-slate-500 dark:text-slate-400">Panel de Empleado</p>
            </div>
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900">
                <LogoutIcon />
                Cerrar Sesión
            </button>
        </header>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-200 rounded-lg dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">{error}</div>}

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ClockIcon /> Reloj de Fichaje</h2>
          <button
            onClick={handleClock}
            disabled={isLoading}
            className={`w-full py-4 px-6 text-lg font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 ${
              isLoading
                ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
                : currentEntry
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isLoading ? 'Procesando...' : currentEntry ? 'Fichar Salida' : 'Fichar Entrada'}
            {isLoading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          </button>
          {currentEntry && <p className="text-center mt-4 text-sm text-slate-500 dark:text-slate-400">Fichado desde: {currentEntry.clockIn.toLocaleTimeString()}</p>}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PlusCircleIcon /> Registrar Horas Extra</h2>
          <form onSubmit={handleOvertimeSubmit} className="flex gap-2">
            <input
              type="number"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(e.target.value)}
              placeholder="Horas"
              min="0.1"
              step="0.1"
              className="flex-grow p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              disabled={!currentEntry}
            />
            <button type="submit" className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={!currentEntry}>
              Añadir
            </button>
          </form>
           <p className="text-center mt-4 text-sm text-slate-500 dark:text-slate-400">Total de horas extra esta sesión: {currentEntry?.overtimeHours || 0} horas</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Tus Registros Horarios</h2>
        <div className="space-y-4">
          {userTimeEntries.length > 0 ? userTimeEntries.map(entry => (
            <div key={entry.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">{entry.clockIn.toLocaleDateString()}</span>
                    <span className="text-sm font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {entry.clockOut ? `Duración: ${((entry.clockOut.getTime() - entry.clockIn.getTime()) / 3600000).toFixed(2)} hrs` : 'En Progreso'}
                    </span>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <LocationDetail type="Entrada" time={entry.clockIn} location={entry.clockInLocation} />
                    {entry.clockOut && entry.clockOutLocation && <LocationDetail type="Salida" time={entry.clockOut} location={entry.clockOutLocation} />}
                </div>
                 {entry.overtimeHours && <p className="text-right mt-2 font-semibold text-indigo-600 dark:text-indigo-400">Horas Extra: {entry.overtimeHours} hrs</p>}
            </div>
          )) : <p className="text-center text-slate-500 dark:text-slate-400 py-8">Aún no hay registros de tiempo.</p>}
        </div>
      </div>
    </div>
  );
};

const LocationDetail = ({ type, time, location }: { type: string, time: Date, location: LocationInfo }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
        <p className="font-semibold text-slate-800 dark:text-slate-200">{type} a las {time.toLocaleTimeString()}</p>
        <div className="flex items-start gap-2 mt-2 text-slate-600 dark:text-slate-400">
            <LocationMarkerIcon />
            <div>
                <p>{location.description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">({location.latitude.toFixed(5)}, {location.longitude.toFixed(5)})</p>
                {location.mapUri && <a href={location.mapUri} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline text-sm">Ver en el Mapa</a>}
            </div>
        </div>
    </div>
);

export default EmployeeDashboard;