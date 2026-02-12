const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'progress_net_secret_key_2024';
const TIMEZONE = 'America/Bogota';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar multer para subir fotos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Conectar a la base de datos
const db = new sqlite3.Database('progress_net_assistance.db', (err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        
        // Crear tablas si no existen
        db.run(`CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            position TEXT,
            role TEXT DEFAULT 'employee',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creando tabla employees:', err);
        });

        db.run(`CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            employee_name TEXT NOT NULL,
            type TEXT NOT NULL,
            photo_path TEXT,
            latitude REAL,
            longitude REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            admin_registered BOOLEAN DEFAULT 0,
            admin_id INTEGER,
            admin_name TEXT,
            exit_reason TEXT,
            other_reason TEXT,
            admin_notes TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees (id)
        )`, (err) => {
            if (err) console.error('Error creando tabla attendance:', err);
        });
    }
});

// Middleware de autenticación
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

// Endpoint para que el administrador registre asistencia
app.post('/api/admin/attendance', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado - Solo administradores pueden registrar asistencia administrativamente' });
    }

    const { 
        employee_name, 
        type, 
        timestamp, 
        admin_registered,
        admin_id,
        admin_name,
        exit_reason,
        other_reason,
        admin_notes,
        latitude,
        longitude,
        photo_path
    } = req.body;
    
    if (!employee_name || !type || !timestamp) {
        return res.status(400).json({ error: 'Empleado, tipo y timestamp son requeridos' });
    }

    if (type !== 'exit') {
        return res.status(400).json({ error: 'Solo se pueden registrar salidas administrativamente' });
    }

    // Verificar que el empleado exista
    db.get("SELECT id FROM employees WHERE name = ?", [employee_name], (err, employee) => {
        if (err) {
            console.error('Error buscando empleado:', err);
            return res.status(500).json({ error: 'Error al buscar empleado' });
        }
        
        if (!employee) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // Insertar registro de asistencia administrativo
        db.run(`
            INSERT INTO attendance (
                employee_id, 
                employee_name, 
                type, 
                timestamp, 
                latitude, 
                longitude, 
                photo_path,
                admin_registered,
                admin_id,
                admin_name,
                exit_reason,
                other_reason,
                admin_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            employee.id,
            employee_name,
            type,
            timestamp,
            latitude,
            longitude,
            photo_path,
            admin_registered,
            admin_id,
            admin_name,
            exit_reason,
            other_reason,
            admin_notes
        ], function(err) {
            if (err) {
                console.error('Error registrando asistencia administrativa:', err);
                return res.status(500).json({ error: 'Error al registrar asistencia administrativa' });
            }
            
            res.json({ 
                message: 'Asistencia registrada administrativamente correctamente',
                id: this.lastID,
                timestamp: timestamp,
                employee: employee_name,
                registered_by: admin_name
            });
        });
    });
});

// Endpoint de login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    db.get("SELECT * FROM employees WHERE email = ?", [email], (err, user) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                position: user.position
            }
        });
    });
});

// Endpoint para obtener empleados
app.get('/api/admin/employees', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    db.all("SELECT id, name, email, position, role, created_at FROM employees", (err, employees) => {
        if (err) {
            console.error('Error obteniendo empleados:', err);
            return res.status(500).json({ error: 'Error obteniendo empleados' });
        }
        res.json(employees);
    });
});

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Iniciar servidor
app.listen(PORT, () => {
    console.log('Servidor corriendo en http://localhost:3000');
    console.log('Usuario admin: admin@progress.com / admin123');
});
