import { User, TimeEntry, ContractorSubmission } from '../types';
import { USERS, MOCK_TIME_ENTRIES, MOCK_CONTRACTOR_SUBMISSIONS } from '../constants';

const API_URL = '/api';

const headers = {
    'Content-Type': 'application/json',
};

// --- LOCAL STORAGE ADAPTER (Fallback para Netlify) ---
// Estas funciones simulan el backend cuando no hay servidor disponible.

const STORAGE_KEYS = {
    USERS: 'pecc_time_users',
    ENTRIES: 'pecc_time_entries',
    SUBMISSIONS: 'pecc_time_submissions'
};

const localAdapter = {
    init: () => {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(USERS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
            // Asignamos IDs a los mocks para que sean compatibles
            const entriesWithIds = MOCK_TIME_ENTRIES.map((e, i) => ({ ...e, id: i + 1 }));
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entriesWithIds));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
             const subsWithIds = MOCK_CONTRACTOR_SUBMISSIONS.map((s, i) => ({ ...s, id: i + 1 }));
            localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subsWithIds));
        }
    },
    getUsers: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
    setUsers: (users: User[]) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)),
    getEntries: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || '[]'),
    setEntries: (entries: TimeEntry[]) => localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries)),
    getSubmissions: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || '[]'),
    setSubmissions: (subs: ContractorSubmission[]) => localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs))
};

// Inicializamos datos locales por si acaso
localAdapter.init();

// --- API SERVICE ---

// Variable para detectar si el backend está activo
let isBackendAvailable = true;

// Helper para manejar peticiones. Si fallan, usa LocalStorage.
const fetchWithFallback = async (endpoint: string, options?: RequestInit) => {
    // Si ya sabemos que el backend no está, vamos directo al fallback
    if (!isBackendAvailable) {
        throw new Error('Backend unavailable');
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            // Si es un error 404/500 del servidor real, lanzamos error.
            // Si el servidor no existe (ej. Netlify), fetch tirará una excepción de red.
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        // Si hay error de red (fetch failed), asumimos que no hay backend y cambiamos a modo LocalStorage
        console.warn(`Backend no disponible en ${endpoint}. Cambiando a modo LocalStorage.`, error);
        isBackendAvailable = false;
        throw new Error('Switching to local');
    }
};

export const api = {
    // Helper para verificar estado visualmente
    getBackendStatus: () => isBackendAvailable,

    // Auth
    login: async (username: string, password: string): Promise<User | null> => {
        try {
            return await fetchWithFallback('/auth/login', {
                method: 'POST',
                headers,
                body: JSON.stringify({ username, password }),
            });
        } catch (e) {
            // Fallback Local
            const users = localAdapter.getUsers();
            return users.find((u: User) => u.name === username && u.password === password) || null;
        }
    },

    // Users
    getUsers: async (): Promise<User[]> => {
        try {
            return await fetchWithFallback('/users');
        } catch (e) {
            return localAdapter.getUsers();
        }
    },

    createUser: async (user: Omit<User, 'id' | 'forcePasswordChange'>): Promise<User> => {
        try {
            return await fetchWithFallback('/users', {
                method: 'POST',
                headers,
                body: JSON.stringify(user),
            });
        } catch (e) {
            const users = localAdapter.getUsers();
            const newUser = { ...user, id: Date.now(), forcePasswordChange: true } as User;
            users.push(newUser);
            localAdapter.setUsers(users);
            return newUser;
        }
    },

    updateUser: async (user: User): Promise<User> => {
        try {
            return await fetchWithFallback(`/users/${user.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(user),
            });
        } catch (e) {
            const users = localAdapter.getUsers();
            const index = users.findIndex((u: User) => u.id === user.id);
            if (index !== -1) {
                users[index] = user;
                localAdapter.setUsers(users);
            }
            return user;
        }
    },

    deleteUser: async (userId: number): Promise<void> => {
        try {
            await fetchWithFallback(`/users/${userId}`, { method: 'DELETE' });
        } catch (e) {
            const users = localAdapter.getUsers();
            const filtered = users.filter((u: User) => u.id !== userId);
            localAdapter.setUsers(filtered);
        }
    },

    // Time Entries
    getTimeEntries: async (): Promise<TimeEntry[]> => {
        let entries;
        try {
            const rawEntries = await fetchWithFallback('/time-entries');
            entries = rawEntries;
        } catch (e) {
            entries = localAdapter.getEntries();
        }
        
        // Parse dates
        return entries.map((e: any) => ({
            ...e,
            clockIn: new Date(e.clockIn),
            clockOut: e.clockOut ? new Date(e.clockOut) : undefined
        }));
    },

    createTimeEntry: async (entry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> => {
        try {
            const saved = await fetchWithFallback('/time-entries', {
                method: 'POST',
                headers,
                body: JSON.stringify(entry),
            });
            return { ...saved, clockIn: new Date(saved.clockIn), clockOut: saved.clockOut ? new Date(saved.clockOut) : undefined };
        } catch (e) {
            const entries = localAdapter.getEntries();
            const newEntry = { ...entry, id: Date.now() } as TimeEntry;
            entries.push(newEntry);
            localAdapter.setEntries(entries);
            return newEntry;
        }
    },

    updateTimeEntry: async (entry: TimeEntry): Promise<TimeEntry> => {
        try {
            const saved = await fetchWithFallback(`/time-entries/${entry.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(entry),
            });
            return { ...saved, clockIn: new Date(saved.clockIn), clockOut: saved.clockOut ? new Date(saved.clockOut) : undefined };
        } catch (e) {
             const entries = localAdapter.getEntries();
            const index = entries.findIndex((e: TimeEntry) => e.id === entry.id);
            if (index !== -1) {
                entries[index] = entry;
                localAdapter.setEntries(entries);
            }
            return entry;
        }
    },

    // Contractor Submissions
    getContractorSubmissions: async (): Promise<ContractorSubmission[]> => {
        let submissions;
        try {
            const rawSubs = await fetchWithFallback('/contractor-submissions');
            submissions = rawSubs;
        } catch (e) {
            submissions = localAdapter.getSubmissions();
        }
        return submissions.map((s: any) => ({ ...s, submissionDate: new Date(s.submissionDate) }));
    },

    createContractorSubmission: async (submission: Omit<ContractorSubmission, 'id'>): Promise<ContractorSubmission> => {
        try {
            const saved = await fetchWithFallback('/contractor-submissions', {
                method: 'POST',
                headers,
                body: JSON.stringify(submission),
            });
            return { ...saved, submissionDate: new Date(saved.submissionDate) };
        } catch (e) {
            const subs = localAdapter.getSubmissions();
            const newSub = { ...submission, id: Date.now() } as ContractorSubmission;
            subs.push(newSub);
            localAdapter.setSubmissions(subs);
            return newSub;
        }
    }
};