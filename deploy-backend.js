const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'progress-secret-2024';

// Database
const db = new sqlite3.Database('./progress.db');

// Middleware
app.use(cors({
    origin: ['https://public-9ocv47zlb-progresss-projects-509b99f1.vercel.app', 'http://localhost:3000', 'https://public-dxogmor9l-progresss-projects-509b99f1.vercel.app'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// File upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'attendance-' + uniqueSuffix + '.jpg');
    }
});

const upload = multer({ storage: storage });

// Initialize database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'employee',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        employee_name TEXT,
        type TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        photo_path TEXT,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (employee_id) REFERENCES users (id)
    )`);

    // Create default admin if not exists
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        ['Admin', 'admin@progress.com', defaultPassword, 'admin']);
});

// Routes
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    });
});

app.get('/api/admin/employees', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        db.all('SELECT id, name, email, role FROM users ORDER BY name', (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

// Ruta para obtener registros del usuario actual
app.get('/api/attendance', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const employeeId = decoded.id;
        
        db.all(`
            SELECT a.*, u.name as employee_name 
            FROM attendance a 
            LEFT JOIN users u ON a.employee_id = u.id 
            WHERE a.employee_id = ? 
            ORDER BY a.timestamp DESC
        `, [employeeId], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener registros' });
            }
            res.json(rows);
        });
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
});

app.get('/api/admin/attendance', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        db.all(`SELECT a.*, u.name as employee_name 
                FROM attendance a 
                LEFT JOIN users u ON a.employee_id = u.id 
                ORDER BY a.timestamp DESC`, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

app.post('/api/attendance', upload.single('photo'), (req, res) => {
    const { employee_id, employee_name, type, latitude, longitude } = req.body;
    const photo_path = req.file ? req.file.filename : null;
    
    db.run(`INSERT INTO attendance (employee_id, employee_name, type, photo_path, latitude, longitude) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [employee_id, employee_name, type, photo_path, latitude, longitude],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Registro guardado' });
        });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
