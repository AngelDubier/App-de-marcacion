const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// --- DATABASE HELPER ---
// Un sistema de base de datos simple basado en archivos JSON
const initialData = {
  users: [
    { id: 1, name: 'Alice', role: 'employee', password: 'password123', forcePasswordChange: true },
    { id: 2, name: 'Bob', role: 'employee', password: 'password456', forcePasswordChange: false },
    { id: 3, name: 'Charlie', role: 'contractor', password: 'password789', forcePasswordChange: false },
    { id: 4, name: 'Admin User', role: 'admin', password: 'adminpassword', forcePasswordChange: false },
    { id: 5, name: 'Creator User', role: 'creator', password: 'creatorpassword', forcePasswordChange: false },
  ],
  timeEntries: [],
  contractorSubmissions: []
};

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- ROUTES ---

// 1. Auth
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.name === username && u.password === password);
    
    if (user) {
        // En una app real, aquí generaríamos un JWT
        const { password, ...userWithoutPassword } = user;
        res.json(user); // Devolvemos el usuario completo por simplicidad en esta demo
    } else {
        res.status(401).json({ message: 'Credenciales inválidas' });
    }
});

// 2. Users
app.get('/api/users', (req, res) => {
    const db = readDB();
    res.json(db.users);
});

app.post('/api/users', (req, res) => {
    const db = readDB();
    const newUser = { ...req.body, id: Date.now(), forcePasswordChange: true };
    db.users.push(newUser);
    writeDB(db);
    res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.users.findIndex(u => u.id === id);
    if (index !== -1) {
        db.users[index] = { ...db.users[index], ...req.body };
        writeDB(db);
        res.json(db.users[index]);
    } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
    }
});

app.delete('/api/users/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.users = db.users.filter(u => u.id !== id);
    writeDB(db);
    res.status(204).send();
});

// 3. Time Entries
app.get('/api/time-entries', (req, res) => {
    const db = readDB();
    res.json(db.timeEntries);
});

app.post('/api/time-entries', (req, res) => {
    const db = readDB();
    const newEntry = { ...req.body, id: Date.now() };
    db.timeEntries.push(newEntry);
    writeDB(db);
    res.json(newEntry);
});

app.put('/api/time-entries/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.timeEntries.findIndex(e => e.id === id);
    if (index !== -1) {
        db.timeEntries[index] = { ...db.timeEntries[index], ...req.body };
        writeDB(db);
        res.json(db.timeEntries[index]);
    } else {
        res.status(404).json({ message: 'Registro no encontrado' });
    }
});

// 4. Contractor Submissions
app.get('/api/contractor-submissions', (req, res) => {
    const db = readDB();
    res.json(db.contractorSubmissions);
});

app.post('/api/contractor-submissions', (req, res) => {
    const db = readDB();
    const newSub = { ...req.body, id: Date.now() };
    db.contractorSubmissions.push(newSub);
    writeDB(db);
    res.json(newSub);
});

app.listen(PORT, () => {
    console.log(`Backend de PECC-TIME corriendo en http://localhost:${PORT}`);
});