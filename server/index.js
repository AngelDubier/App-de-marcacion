require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// --- CONFIGURACIÓN DE BASE DE DATOS (POSTGRESQL) ---
// Reemplazamos db.json por una conexión real.
// Asegúrate de tener DATABASE_URL en tu archivo .env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ ERROR CRÍTICO: No se encontró la variable DATABASE_URL.");
    console.error("Para persistir los datos, configura una base de datos PostgreSQL.");
    console.error("Ejemplo .env: DATABASE_URL=postgres://user:pass@host:5432/db");
    // No detenemos el proceso para permitir depuración, pero las peticiones fallarán.
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Necesario para la mayoría de DBs en la nube (Neon, Supabase, Heroku)
    }
});

// --- INICIALIZACIÓN DE TABLAS Y DATOS ---
const initDB = async () => {
    try {
        console.log("🔄 Verificando esquema de base de datos...");

        // 1. Tabla de Usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                password TEXT NOT NULL,
                force_password_change BOOLEAN DEFAULT FALSE
            );
        `);

        // 2. Tabla de Registros de Tiempo (Marcaciones)
        // Usamos JSONB para las ubicaciones para mantener la estructura flexible del frontend
        await pool.query(`
            CREATE TABLE IF NOT EXISTS time_entries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                user_name TEXT,
                clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
                clock_out TIMESTAMP WITH TIME ZONE,
                clock_in_location JSONB,
                clock_out_location JSONB,
                overtime_hours NUMERIC DEFAULT 0
            );
        `);

        // 3. Tabla de Envíos de Contratistas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS contractor_submissions (
                id SERIAL PRIMARY KEY,
                contractor_id INTEGER REFERENCES users(id),
                employee_name TEXT NOT NULL,
                cedula TEXT,
                obra TEXT,
                hours_worked NUMERIC,
                daily_rate NUMERIC,
                submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // --- SEEDING (Datos Iniciales) ---
        // Si la tabla de usuarios está vacía, insertamos los usuarios por defecto para no perder acceso.
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count) === 0) {
            console.log("⚠️ Base de datos vacía. Insertando datos iniciales de seguridad...");
            const initialUsers = [
                { name: 'Alice', role: 'employee', password: 'password123', force_password_change: true },
                { name: 'Bob', role: 'employee', password: 'password456', force_password_change: false },
                { name: 'Charlie', role: 'contractor', password: 'password789', force_password_change: false },
                { name: 'Admin User', role: 'admin', password: 'adminpassword', force_password_change: false },
                { name: 'Creator User', role: 'creator', password: 'creatorpassword', force_password_change: false },
            ];

            for (const user of initialUsers) {
                await pool.query(
                    'INSERT INTO users (name, role, password, force_password_change) VALUES ($1, $2, $3, $4)',
                    [user.name, user.role, user.password, user.force_password_change]
                );
            }
            console.log("✅ Usuarios iniciales creados correctamente.");
        }

        console.log("✅ Base de Datos conectada y sincronizada.");

    } catch (err) {
        console.error("❌ Error al inicializar la Base de Datos:", err);
    }
};

// Ejecutar inicialización al arrancar
if (connectionString) {
    initDB();
}

// --- RUTAS DE LA API (CRUD REAL) ---

// 1. Auth
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE name = $1 AND password = $2',
            [username, password]
        );
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Convertir snake_case (DB) a camelCase (Frontend)
            res.json({
                id: user.id,
                name: user.name,
                role: user.role,
                forcePasswordChange: user.force_password_change
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error de base de datos' });
    }
});

// 2. Users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, role, force_password_change FROM users ORDER BY id ASC');
        // Mapear respuesta para el frontend
        const users = result.rows.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role,
            forcePasswordChange: u.force_password_change
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, role, password } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (name, role, password, force_password_change) VALUES ($1, $2, $3, true) RETURNING id, name, role, force_password_change',
            [name, role, password]
        );
        const newUser = result.rows[0];
        res.json({
            id: newUser.id,
            name: newUser.name,
            role: newUser.role,
            forcePasswordChange: newUser.force_password_change
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, role, password, forcePasswordChange } = req.body;
    
    try {
        let query, params;
        
        // Si viene password, actualizamos todo
        if (password) {
            query = 'UPDATE users SET name = $1, role = $2, password = $3, force_password_change = $4 WHERE id = $5 RETURNING id, name, role, force_password_change';
            params = [name, role, password, forcePasswordChange, id];
        } else {
            // Si no, solo actualizamos info básica
            query = 'UPDATE users SET name = $1, role = $2, force_password_change = $3 WHERE id = $4 RETURNING id, name, role, force_password_change';
            params = [name, role, forcePasswordChange, id];
        }

        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const updatedUser = result.rows[0];
        res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            role: updatedUser.role,
            forcePasswordChange: updatedUser.force_password_change
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Time Entries
app.get('/api/time-entries', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM time_entries ORDER BY clock_in DESC');
        // Mapear de snake_case a camelCase para el frontend
        const entries = result.rows.map(e => ({
            id: e.id,
            userId: e.user_id,
            userName: e.user_name,
            clockIn: e.clock_in,
            clockOut: e.clock_out,
            clockInLocation: e.clock_in_location,
            clockOutLocation: e.clock_out_location,
            overtimeHours: parseFloat(e.overtime_hours)
        }));
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/time-entries', async (req, res) => {
    const { userId, userName, clockIn, clockInLocation } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO time_entries (user_id, user_name, clock_in, clock_in_location) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, userName, clockIn, clockInLocation]
        );
        const e = result.rows[0];
        res.json({
            id: e.id,
            userId: e.user_id,
            userName: e.user_name,
            clockIn: e.clock_in,
            clockInLocation: e.clock_in_location
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/time-entries/:id', async (req, res) => {
    const { id } = req.params;
    const { clockOut, clockOutLocation, overtimeHours } = req.body;
    
    try {
        // Esta ruta se usa principalmente para hacer Clock Out
        const result = await pool.query(
            'UPDATE time_entries SET clock_out = $1, clock_out_location = $2, overtime_hours = $3 WHERE id = $4 RETURNING *',
            [clockOut, clockOutLocation, overtimeHours || 0, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        const e = result.rows[0];
        res.json({
            id: e.id,
            userId: e.user_id,
            userName: e.user_name,
            clockIn: e.clock_in,
            clockOut: e.clock_out,
            clockInLocation: e.clock_in_location,
            clockOutLocation: e.clock_out_location,
            overtimeHours: parseFloat(e.overtime_hours)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Contractor Submissions
app.get('/api/contractor-submissions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contractor_submissions ORDER BY submission_date DESC');
        const subs = result.rows.map(s => ({
            id: s.id,
            contractorId: s.contractor_id,
            employeeName: s.employee_name,
            cedula: s.cedula,
            obra: s.obra,
            hoursWorked: parseFloat(s.hours_worked),
            dailyRate: parseFloat(s.daily_rate),
            submissionDate: s.submission_date
        }));
        res.json(subs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/contractor-submissions', async (req, res) => {
    const { contractorId, employeeName, cedula, obra, hoursWorked, dailyRate, submissionDate } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO contractor_submissions (contractor_id, employee_name, cedula, obra, hours_worked, daily_rate, submission_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [contractorId, employeeName, cedula, obra, hoursWorked, dailyRate, submissionDate]
        );
        const s = result.rows[0];
        res.json({
            id: s.id,
            contractorId: s.contractor_id,
            employeeName: s.employee_name,
            cedula: s.cedula,
            obra: s.obra,
            hoursWorked: parseFloat(s.hours_worked),
            dailyRate: parseFloat(s.daily_rate),
            submissionDate: s.submission_date
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend (PostgreSQL) corriendo en http://localhost:${PORT}`);
});
