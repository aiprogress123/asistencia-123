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

// Database - usar /tmp para Railway
const db = new sqlite3.Database('/tmp/progress.db');

// Middleware
app.use(cors({
    origin: ['https://progress-assistance-system.vercel.app', 'https://*.vercel.app', '*'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// File upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = '/tmp/uploads';
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

app.post('/api/admin/employees', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        const { name, email, password, role } = req.body;
        
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
            [name, email, hashedPassword, role], 
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        return res.status(400).json({ error: 'El email ya existe' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                
                res.json({ 
                    id: this.lastID, 
                    name, 
                    email, 
                    role,
                    message: 'Empleado creado exitosamente' 
                });
            }
        );
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

app.get('/api/admin/employees/:id', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        const { id } = req.params;
        
        db.get('SELECT id, name, email, role FROM users WHERE id = ?', [id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (!row) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }
            
            res.json(row);
        });
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

app.put('/api/admin/employees/:id', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        const { id } = req.params;
        const { name, email, role } = req.body;
        
        if (!name || !email || !role) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
        
        db.run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', 
            [name, email, role, id], 
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        return res.status(400).json({ error: 'El email ya existe' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Empleado no encontrado' });
                }
                
                res.json({ 
                    id: parseInt(id), 
                    name, 
                    email, 
                    role,
                    message: 'Empleado actualizado exitosamente' 
                });
            }
        );
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
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

app.post('/api/admin/attendance', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        
        const { employee_id, employee_name, type, timestamp, latitude, longitude, photo_path } = req.body;
        
        if (!employee_id || !employee_name || !type || !timestamp) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }
        
        db.run('INSERT INTO attendance (employee_id, employee_name, type, timestamp, latitude, longitude, photo_path) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [employee_id, employee_name, type, timestamp, latitude, longitude, photo_path], 
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                res.json({ 
                    id: this.lastID, 
                    employee_id, 
                    employee_name, 
                    type,
                    timestamp,
                    message: 'Registro creado exitosamente' 
                });
            }
        );
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

// Endpoint para que los empleados registren su propia asistencia
app.post('/api/attendance', upload.single('photo'), (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Obtener datos del FormData
        const { type, timestamp, latitude, longitude } = req.body;
        const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
        
        console.log('📸 Datos recibidos:', { type, timestamp, latitude, longitude, photo_path });
        console.log('👤 Usuario:', decoded);
        
        if (!type) {
            return res.status(400).json({ error: 'Tipo es requerido' });
        }
        
        // Usar timestamp actual si no se proporciona
        const recordTimestamp = timestamp || new Date().toISOString();
        
        // Usar el ID del token para registrar la asistencia
        db.run('INSERT INTO attendance (employee_id, employee_name, type, timestamp, latitude, longitude, photo_path) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [decoded.id, decoded.email, type, recordTimestamp, latitude, longitude, photo_path], 
            function(err) {
                if (err) {
                    console.error('❌ Error insertando registro:', err);
                    return res.status(500).json({ error: err.message });
                }
                
                console.log('✅ Registro creado:', this.lastID);
                res.json({ 
                    id: this.lastID, 
                    employee_id: decoded.id, 
                    employee_name: decoded.email,
                    type,
                    timestamp: recordTimestamp,
                    photo_path,
                    message: 'Registro de asistencia creado exitosamente' 
                });
            }
        );
    } catch (error) {
        console.error('❌ Error de token:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
});

// Endpoint para que los empleados vean su propia asistencia
app.get('/api/attendance', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Si es admin, devuelve todos los registros
        if (decoded.role === 'admin') {
            db.all(`SELECT a.*, u.name as employee_name 
                    FROM attendance a 
                    LEFT JOIN users u ON a.employee_id = u.id 
                    ORDER BY a.timestamp DESC`, (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        } else {
            // Si es empleado, solo devuelve sus propios registros
            db.all(`SELECT a.*, u.name as employee_name 
                    FROM attendance a 
                    LEFT JOIN users u ON a.employee_id = u.id 
                    WHERE a.employee_id = ? 
                    ORDER BY a.timestamp DESC`, [decoded.id], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        }
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Endpoint para inicializar datos de prueba
app.get('/api/init-data', (req, res) => {
    console.log('🔄 Inicializando datos de prueba...');
    
    db.serialize(() => {
        // Verificar si ya hay datos
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Error verificando datos' });
            }
            
            if (row.count > 0) {
                console.log('📊 Base de datos ya tiene datos:', row.count, 'usuarios');
                return res.json({ message: 'Base de datos ya inicializada', users: row.count });
            }
            
            // Insertar usuarios de prueba
            const adminPassword = bcrypt.hashSync('admin123', 10);
            const empPassword = bcrypt.hashSync('emp123', 10);
            
            const users = [
                ['Alvaro', 'admin@progress.com', adminPassword, 'admin'],
                ['Javier', 'javier@progress.com', empPassword, 'employee'],
                ['Luis', 'luis@progress.com', empPassword, 'employee'],
                ['Maria', 'maria@progress.com', empPassword, 'employee'],
                ['Carlos', 'carlos@progress.com', empPassword, 'coordinator']
            ];
            
            const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
            
            users.forEach(user => {
                stmt.run(user, (err) => {
                    if (err) {
                        console.error('❌ Error insertando usuario:', err);
                    } else {
                        console.log('✅ Usuario creado:', user[0]);
                    }
                });
            });
            
            stmt.finalize(() => {
                console.log('✅ Datos de prueba inicializados');
                res.json({ message: 'Datos de prueba inicializados', users: users.length });
            });
        });
    });
});

// Endpoint para crear registros de asistencia de prueba
app.get('/api/create-sample-attendance', (req, res) => {
    console.log('🔄 Creando registros de asistencia de prueba...');
    
    db.serialize(() => {
        // Verificar si ya hay registros
        db.get('SELECT COUNT(*) as count FROM attendance', (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Error verificando registros' });
            }
            
            if (row.count > 0) {
                console.log('📊 Ya hay registros de asistencia:', row.count);
                return res.json({ message: 'Ya existen registros de asistencia', records: row.count });
            }
            
            // Obtener usuarios para crear registros
            db.all('SELECT id, name FROM users WHERE role != "admin"', (err, users) => {
                if (err) {
                    return res.status(500).json({ error: 'Error obteniendo usuarios' });
                }
                
                const sampleRecords = [];
                const now = new Date();
                
                users.forEach(user => {
                    // Crear registros para los últimos 3 días
                    for (let day = 0; day < 3; day++) {
                        const recordDate = new Date(now);
                        recordDate.setDate(now.getDate() - day);
                        
                        // Entrada (8:00 AM)
                        const entryTime = new Date(recordDate);
                        entryTime.setHours(8, 0, 0, 0);
                        
                        sampleRecords.push([
                            user.id,
                            user.name,
                            'entry',
                            entryTime.toISOString(),
                            null,
                            19.4326,
                            -99.1332
                        ]);
                        
                        // Salida (5:00 PM)
                        const exitTime = new Date(recordDate);
                        exitTime.setHours(17, 0, 0, 0);
                        
                        sampleRecords.push([
                            user.id,
                            user.name,
                            'exit',
                            exitTime.toISOString(),
                            null,
                            19.4326,
                            -99.1332
                        ]);
                    }
                });
                
                const stmt = db.prepare('INSERT INTO attendance (employee_id, employee_name, type, timestamp, photo_path, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)');
                
                sampleRecords.forEach(record => {
                    stmt.run(record, (err) => {
                        if (err) {
                            console.error('❌ Error insertando registro:', err);
                        }
                    });
                });
                
                stmt.finalize(() => {
                    console.log('✅ Registros de asistencia creados:', sampleRecords.length);
                    res.json({ 
                        message: 'Registros de asistencia creados', 
                        records: sampleRecords.length 
                    });
                });
            });
        });
    });
});

app.use('/uploads', express.static('/tmp/uploads'));

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
