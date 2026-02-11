const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Para Vercel, usar base de datos en memoria o PostgreSQL
let database;

if (process.env.NODE_ENV === 'production') {
    // En producción, necesitarás PostgreSQL o similar
    // Por ahora, usaremos SQLite para desarrollo local
    const sqlite3 = require('sqlite3').verbose();
    database = new sqlite3.Database('progress_net_assistance.db');
} else {
    const sqlite3 = require('sqlite3').verbose();
    database = new sqlite3.Database('progress_net_assistance.db');
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'progress-secret-key-2024';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'attendance-' + uniqueSuffix + '.jpg');
    }
});

const upload = multer({ storage: storage });

database.serialize(() => {
    database.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        position TEXT,
        role TEXT DEFAULT 'employee',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    database.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        type TEXT NOT NULL,
        photo_path TEXT,
        latitude REAL,
        longitude REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
    )`);

    database.get("SELECT COUNT(*) as count FROM employees WHERE role = 'admin'", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        if (row.count === 0) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            database.run(`
                INSERT INTO employees (name, email, password, role) 
                VALUES ('Administrador', 'admin@progress.com', ?, 'admin')
            `, [hashedPassword]);
        }
    });
});

// Verificar token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM employees WHERE email = ?", [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error del servidor' });
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
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

app.post('/api/attendance', authenticateToken, upload.single('photo'), (req, res) => {
    const { type, latitude, longitude } = req.body;
    const employeeId = req.user.id;
    const photoPath = req.file ? req.file.filename : null;

    // Obtener fecha y hora actual en zona horaria de Colombia
    const now = new Date();
    const colombiaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    
    // Formatear timestamp para base de datos
    const timestamp = colombiaTime.toISOString();

    db.run(`
        INSERT INTO attendance (employee_id, type, timestamp, photo_path, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
    `, [employeeId, type, timestamp, photoPath, latitude, longitude], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al registrar asistencia' });
        }
        res.json({ 
            message: 'Asistencia registrada correctamente',
            id: this.lastID,
            timestamp: timestamp
        });
    });
});

app.get('/api/attendance', authenticateToken, (req, res) => {
    const employeeId = req.user.id;
    
    db.all(`
        SELECT a.*, e.name as employee_name 
        FROM attendance a 
        JOIN employees e ON a.employee_id = e.id 
        WHERE a.employee_id = ? 
        ORDER BY a.timestamp DESC
    `, [employeeId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener registros' });
        }
        res.json(rows);
    });
});

app.get('/api/admin/employees', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    db.all("SELECT id, name, email, position, role, created_at FROM employees", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener empleados' });
        }
        res.json(rows);
    });
});

app.get('/api/admin/attendance', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    db.all(`
        SELECT a.*, e.name as employee_name, e.position 
        FROM attendance a 
        JOIN employees e ON a.employee_id = e.id 
        ORDER BY a.timestamp DESC
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener registros' });
        }
        res.json(rows);
    });
});

app.post('/api/admin/employees', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { name, email, password, position } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(`
        INSERT INTO employees (name, email, password, position) 
        VALUES (?, ?, ?, ?)
    `, [name, email, hashedPassword, position], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al crear empleado' });
        }
        res.json({ 
            message: 'Empleado creado correctamente',
            id: this.lastID 
        });
    });
});

// Eliminar registro de asistencia individual
app.delete('/attendance/:id', (req, res) => {
    const { id } = req.params;
    
    db.run(
        'DELETE FROM attendance WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                console.error('Error al eliminar registro:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            res.json({ message: 'Registro eliminado exitosamente' });
        }
    );
});

// Eliminar todos los registros del usuario actual
app.delete('/attendance/all', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    try {
        // Verificar token y obtener user_id
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Token inválido' });
            }

            // Eliminar todos los registros del usuario
            db.run(
                'DELETE FROM attendance WHERE employee_id = ?',
                [decoded.userId],
                function(err) {
                    if (err) {
                        console.error('Error al eliminar registros:', err);
                        return res.status(500).json({ error: 'Error interno del servidor' });
                    }
                    
                    res.json({ message: 'Todos los registros del usuario eliminados exitosamente' });
                }
            );
        });
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar empleado y sus registros de asistencia
app.delete('/admin/employees/:id', (req, res) => {
    const { id } = req.params;
    
    // Verificar que no se elimine al último administrador
    db.get('SELECT COUNT(*) as count FROM employees WHERE role = "admin"', [], (err, row) => {
        if (err) {
            console.error('Error al verificar administradores:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (row.count <= 1) {
            return res.status(400).json({ error: 'No se puede eliminar al último administrador' });
        }
        
        // Eliminar primero los registros de asistencia del empleado
        db.run('DELETE FROM attendance WHERE employee_id = ?', [id], (err) => {
            if (err) {
                console.error('Error al eliminar registros de asistencia:', err);
                return res.status(500).json({ error: 'Error al eliminar registros de asistencia' });
            }
            
            // Eliminar al empleado
            db.run('DELETE FROM employees WHERE id = ?', [id], (err) => {
                if (err) {
                    console.error('Error al eliminar empleado:', err);
                    return res.status(500).json({ error: 'Error al eliminar empleado' });
                }
                
                res.json({ message: 'Empleado y sus registros eliminados exitosamente' });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor de Progress corriendo en http://localhost:${PORT}`);
});
