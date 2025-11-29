
import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../App';
import { getChatbotResponse } from '../services/geminiService';
import { ChatMessage, UserRole, LocationInfo } from '../types';
import { SparklesIcon, LogoutIcon, ClockIcon, DocumentTextIcon, ArrowDownTrayIcon } from './common/Icons';
import UserManagement from './UserManagement';
import MapView from './MapView';

// FIX: Moved component definitions before their usage in AdminDashboard to fix reference errors.
// FIX: Explicitly define props type for StatCard for better readability and type safety.
interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
}

const StatCard = ({ icon, title, value }: StatCardProps) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-600 dark:text-indigo-300">{icon}</div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

// FIX: Explicitly define props type for DataTable to resolve type inference issue.
interface DataTableProps {
    title: string;
    headers: string[];
    // FIX: Made 'children' prop optional to resolve TypeScript error.
    children?: React.ReactNode;
}

const DataTable = ({ title, headers, children }: DataTableProps) => (
     <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold p-4 border-b border-slate-200 dark:border-slate-700">{title}</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        {headers.map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    </div>
);


const AdminDashboard = () => {
  const { currentUser, timeEntries, contractorSubmissions, users, logout } = useAppContext();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [mapModalInfo, setMapModalInfo] = useState<LocationInfo | null>(null);

  const isCreator = currentUser?.role === 'creator';
  const dashboardTitle = isCreator ? "Panel del Creador" : "Panel de Administrador";
  const allowedRoles: UserRole[] = useMemo(() => isCreator
    ? ['admin', 'contractor', 'employee']
    : ['contractor', 'employee'], [isCreator]);

  const contextData = useMemo(() => {
    return JSON.stringify({ timeEntries, contractorSubmissions });
  }, [timeEntries, contractorSubmissions]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const botResponseText = await getChatbotResponse(chatInput, contextData);
      const botMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', text: botResponseText };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', text: "Lo siento, no pude procesar esa solicitud." };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
      // Scroll to bottom
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };
  
    const handleExport = () => {
        let csvContent = "\uFEFF"; // BOM for UTF-8

        // 1. Users Data (excluding passwords)
        csvContent += "Usuarios\n";
        csvContent += "ID,Nombre,Rol\n";
        users.forEach(user => {
            csvContent += `${user.id},"${user.name}","${user.role}"\n`;
        });

        // 2. Time Entries Data
        csvContent += "\nRegistros de Tiempo de Empleados\n";
        csvContent += "ID de Registro,Empleado,Fecha,Hora de Entrada,Hora de Salida,Duración (hrs),Horas Extra,Ubicación de Entrada,Ubicación de Salida\n";
        timeEntries.forEach(entry => {
            const duration = entry.clockOut ? ((entry.clockOut.getTime() - entry.clockIn.getTime()) / 3600000).toFixed(2) : 'N/A';
            const clockInLocation = `"${entry.clockInLocation.description.replace(/"/g, '""')}"`;
            const clockOutLocation = entry.clockOutLocation ? `"${entry.clockOutLocation.description.replace(/"/g, '""')}"` : 'N/A';

            csvContent += `${entry.id},"${entry.userName}",${entry.clockIn.toLocaleDateString('es-ES')},${entry.clockIn.toLocaleTimeString('es-ES')},${entry.clockOut ? entry.clockOut.toLocaleTimeString('es-ES') : 'N/A'},${duration},${entry.overtimeHours || 0},${clockInLocation},${clockOutLocation}\n`;
        });

        // 3. Contractor Submissions Data
        csvContent += "\nEnvíos de Contratistas\n";
        csvContent += "ID de Envío,ID de Contratista,Nombre de Empleado,Cédula,Obra,Horas Trabajadas,Tarifa Diaria,Fecha de Envío\n";
        contractorSubmissions.forEach(sub => {
            csvContent += `${sub.id},${sub.contractorId},"${sub.employeeName}","${sub.cedula}","${sub.obra}",${sub.hoursWorked},${sub.dailyRate},${sub.submissionDate.toLocaleDateString('es-ES')}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "datos_pecc-time.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


  const totalHours = timeEntries.reduce((acc, entry) => {
    if (entry.clockOut) {
        return acc + (entry.clockOut.getTime() - entry.clockIn.getTime()) / 3600000;
    }
    return acc;
  }, 0);

  const totalOvertime = timeEntries.reduce((acc, entry) => acc + (entry.overtimeHours || 0), 0);
  const totalContractorCost = contractorSubmissions.reduce((acc, sub) => acc + (sub.hoursWorked * (sub.dailyRate / 8)), 0); // Assuming 8hr day

  // FIX: Extracted table body generation into variables to simplify JSX and resolve TS error.
  const timeEntryTableRows = timeEntries.length > 0 ? (
    timeEntries.map(entry => (
        <tr key={entry.id} className="border-b border-slate-200 dark:border-slate-700">
            <td className="p-3">{entry.userName}</td>
            <td className="p-3">{entry.clockIn.toLocaleDateString()}</td>
            <td className="p-3">{entry.clockOut ? ((entry.clockOut.getTime() - entry.clockIn.getTime()) / 3600000).toFixed(2) : 'En Progreso'}</td>
            <td className="p-3">{entry.overtimeHours || 0}</td>
            <td className="p-3">
                <div className="flex flex-col items-start gap-1">
                    <button onClick={() => setMapModalInfo(entry.clockInLocation)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline text-left whitespace-nowrap">
                        Ver Entrada
                    </button>
                    {entry.clockOutLocation && (
                        <button onClick={() => setMapModalInfo(entry.clockOutLocation)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline text-left whitespace-nowrap">
                            Ver Salida
                        </button>
                    )}
                </div>
            </td>
        </tr>
    ))
    ) : (
    <tr>
        <td colSpan={5} className="p-3 text-center text-slate-500 dark:text-slate-400">No hay registros de tiempo disponibles.</td>
    </tr>
  );

  const contractorSubmissionsTableRows = contractorSubmissions.length > 0 ? (
    contractorSubmissions.map(sub => (
        <tr key={sub.id} className="border-b border-slate-200 dark:border-slate-700">
            <td className="p-3">Contratista ID: {sub.contractorId}</td>
            <td className="p-3">{sub.employeeName}</td>
            <td className="p-3">{sub.cedula}</td>
            <td className="p-3">{sub.obra}</td>
            <td className="p-3">{sub.hoursWorked}</td>
            <td className="p-3">${sub.dailyRate}/día</td>
            <td className="p-3">{sub.submissionDate.toLocaleDateString()}</td>
        </tr>
    ))
    ) : (
    <tr>
        <td colSpan={7} className="p-3 text-center text-slate-500 dark:text-slate-400">No hay envíos disponibles.</td>
    </tr>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Bienvenido, {currentUser?.name}</h1>
                <p className="text-slate-500 dark:text-slate-400">{dashboardTitle}</p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-900">
                    <ArrowDownTrayIcon />
                    Exportar Datos
                </button>
                <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900">
                    <LogoutIcon />
                    Cerrar Sesión
                </button>
            </div>
        </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <StatCard icon={<ClockIcon />} title="Total Horas Empleados" value={totalHours.toFixed(2)} />
                <StatCard icon={<ClockIcon />} title="Total Horas Extra" value={totalOvertime.toFixed(2)} />
                <StatCard icon={<DocumentTextIcon />} title="Costes Totales Contratistas" value={`$${totalContractorCost.toFixed(2)}`} />
            </div>

            {/* Time Entries Table */}
            <DataTable title="Registros de Tiempo de Empleados" headers={['Empleado', 'Fecha', 'Duración (hrs)', 'Horas Extra', 'Ubicaciones']}>
                {timeEntryTableRows}
            </DataTable>

            {/* Contractor Submissions Table */}
             <DataTable title="Envíos de Contratistas" headers={['Contratista', 'Empleado', 'Cédula', 'Obra', 'Horas', 'Tarifa', 'Fecha']}>
                {contractorSubmissionsTableRows}
            </DataTable>
            
            <UserManagement allowedRoles={allowedRoles} />

        </div>
        
        {/* Chatbot */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg flex flex-col h-[70vh]">
            <h2 className="text-xl font-bold p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2"><SparklesIcon /> Asistente IA</h2>
            <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                 {isChatLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-slate-200 dark:bg-slate-700">
                           <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                           </div>
                        </div>
                    </div>
                )}
            </div>
            <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <input 
                    type="text" 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Pregunta sobre los datos..."
                    className="flex-grow p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button type="submit" disabled={isChatLoading} className="px-5 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400">
                    Enviar
                </button>
            </form>
        </div>
      </div>
      
      {mapModalInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={() => setMapModalInfo(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{mapModalInfo.description}</h3>
                    <button onClick={() => setMapModalInfo(null)} className="text-2xl leading-none font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">&times;</button>
                </div>
                <MapView 
                    center={[mapModalInfo.latitude, mapModalInfo.longitude]} 
                    markerText={mapModalInfo.description} 
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;