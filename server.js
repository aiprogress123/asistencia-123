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
    database = new sqlite3.Database('progress.db');
} else {
    const sqlite3 = require('sqlite3').verbose();
    database = new sqlite3.Database('progress.db');
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'progress-secret-key-2024';

// Middleware para ngrok - manejar correctamente las peticiones API
app.use((req, res, next) => {
    // Si es una petición API y viene de ngrok, asegurar que se maneje correctamente
    if (req.path.startsWith('/api/') && req.get('host') && req.get('host').includes('ngrok')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Si es OPTIONS, responder inmediatamente
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
    }
    next();
});

// CORS simplificado para entorno local
app.use((req, res, next) => {
    // Headers para localhost
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning, Cache-Control, Pragma');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Manejar preflight OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});

app.use(cors({
    origin: ['http://localhost:3000', 'https://unministrant-unforeseeing-meghann.ngrok-free.dev', /^https:\/\/.*\.ngrok\.free\.dev$/],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Agregar Content Security Policy
app.use((req, res, next) => {
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self' ws: wss: https://unministrant-unforeseeing-meghann.ngrok-free.dev https://*.ngrok-free.dev; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; worker-src 'self' blob:; manifest-src 'self';";
    res.setHeader('Content-Security-Policy', csp);
    next();
});

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

// Inicializar base de datos
database.serialize(() => {
    // Crear tabla de empleados si no existe
    database.run(`
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            position TEXT,
            role TEXT DEFAULT 'employee',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Crear tabla de asistencia si no existe
    database.run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            employee_name TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
            timestamp DATETIME NOT NULL,
            photo_path TEXT,
            photo TEXT,
            latitude REAL,
            longitude REAL,
            device_info TEXT,
            admin_exit BOOLEAN DEFAULT 0,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees (id)
        )
    `);

    // Agregar columnas nuevas si no existen (migración)
    database.run(`ALTER TABLE attendance ADD COLUMN admin_exit BOOLEAN DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error agregando columna admin_exit:', err);
        }
    });

    database.run(`ALTER TABLE attendance ADD COLUMN reason TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error agregando columna reason:', err);
        }
    });

    console.log('✅ Base de datos inicializada y migrada');

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
    
    // Verificar empleados existentes
    database.all("SELECT id, name, email, role FROM employees", (err, rows) => {
        if (err) {
            console.error('❌ Error verificando empleados:', err);
            return;
        }
        console.log('👥 Empleados existentes en la base de datos:', rows.length);
        console.log('📋 Lista de empleados:', rows.map(emp => ({
            id: emp.id,
            name: emp.name,
            email: emp.email,
            role: emp.role
        })));
    });
});

// Verificar token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔍 Auth Header:', authHeader);
    console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
        console.log('❌ No token proporcionado');
        return res.status(401).json({ error: 'Token requerido' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ Error verificando token:', err.message);
            return res.status(401).json({ error: 'Token inválido' });
        }
        
        console.log('✅ Token válido para usuario:', user.email, 'rol:', user.role);
        req.user = user;
        next();
    });
}

// Endpoint de registro para empleados
app.post('/api/register', (req, res) => {
    console.log('🚀 Petición de registro recibida');
    console.log('📧 Email:', req.body.email);
    console.log('👤 Nombre:', req.body.name);
    
    const { name, email, password, position } = req.body;

    // Validaciones básicas
    if (!name || !email || !password) {
        console.error('❌ Campos incompletos');
        return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    if (password.length < 6) {
        console.error('❌ Contraseña muy corta');
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error('❌ Email inválido');
        return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    // Verificar si el usuario ya existe
    database.get("SELECT * FROM employees WHERE email = ?", [email], (err, existingUser) => {
        if (err) {
            console.error('❌ Error en base de datos:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        if (existingUser) {
            console.error('❌ Usuario ya existe');
            return res.status(409).json({ error: 'Ya existe una cuenta con este correo electrónico' });
        }

        // Hashear contraseña
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insertar nuevo empleado con rol 'employee' por defecto
        const sql = `
            INSERT INTO employees (name, email, password, position, role, created_at) 
            VALUES (?, ?, ?, ?, 'employee', datetime('now'))
        `;
        
        database.run(sql, [name, email, hashedPassword, position || 'Empleado'], function(err) {
            if (err) {
                console.error('❌ Error creando usuario:', err);
                return res.status(500).json({ error: 'Error al crear la cuenta' });
            }

            console.log('✅ Usuario creado exitosamente:', {
                id: this.lastID,
                name: name,
                email: email,
                role: 'employee'
            });

            // Generar token para el nuevo usuario
            const token = jwt.sign(
                { id: this.lastID, email: email, role: 'employee', name: name },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Cuenta creada exitosamente',
                user: {
                    id: this.lastID,
                    name: name,
                    email: email,
                    position: position || 'Empleado',
                    role: 'employee'
                },
                token: token
            });
        });
    });
});

app.post('/api/login', (req, res) => {
    console.log('🚀 Petición de login recibida');
    console.log('📧 Email:', req.body.email);
    console.log('🔑 Password:', req.body.password ? 'proporcionada' : 'vacía');
    
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
        console.error('❌ Campos incompletos');
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    database.get("SELECT * FROM employees WHERE email = ?", [email], (err, user) => {
        if (err) {
            console.error('❌ Error en base de datos:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        console.log('👤 Usuario encontrado:', user ? 'sí' : 'no');
        
        if (user) {
            console.log('📋 Datos del usuario:', {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hasPassword: !!user.password
            });
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
            console.error('❌ Credenciales incorrectas');
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        console.log('🔐 Contraseña verificada: correcta');
        
        // Generar token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('🎟️ Token generado correctamente');
        console.log('✅ Login exitoso para:', user.name, 'rol:', user.role);

        res.json({
            message: 'Login exitoso',
            token: token,
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
    console.log('🚀 Recibida petición de registro de asistencia');
    console.log('👤 Usuario:', req.user.email, 'ID:', req.user.id, 'Rol:', req.user.role);
    console.log('📋 Tipo:', req.body.type);
    console.log('📍 Ubicación:', req.body.latitude, req.body.longitude);
    console.log('📷 Foto:', req.file ? 'recibida' : 'no recibida');
    
    if (req.file) {
        console.log('📷 Info foto:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    }
    
    const { type, latitude, longitude } = req.body;
    const employeeId = req.user.id;
    const photoPath = req.file ? req.file.filename : null;

    // Validar datos
    if (!type || !latitude || !longitude) {
        console.error('❌ Datos incompletos:', { type, latitude, longitude });
        return res.status(400).json({ error: 'Datos incompletos' });
    }
    
    if (!['entry', 'exit'].includes(type)) {
        console.error('❌ Tipo inválido:', type);
        return res.status(400).json({ error: 'Tipo de registro inválido' });
    }

    // Obtener fecha y hora actual en zona horaria de Colombia
    const now = new Date();
    const colombiaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    
    // Formatear timestamp para base de datos
    const timestamp = colombiaTime.toISOString();
    
    console.log('⏰ Timestamp Colombia:', timestamp);

    database.run(`
        INSERT INTO attendance (employee_id, type, timestamp, photo_path, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
    `, [employeeId, type, timestamp, photoPath, latitude, longitude], function(err) {
        if (err) {
            console.error('❌ Error en base de datos:', err);
            console.error('❌ Detalles del error:', {
                code: err.code,
                errno: err.errno,
                message: err.message
            });
            console.error('❌ Datos que se intentaron insertar:', {
                employeeId,
                type,
                timestamp,
                photoPath,
                latitude,
                longitude
            });
            
            // Manejar errores específicos de SQLite
            let errorMessage = 'Error al registrar asistencia';
            if (err.code === 'SQLITE_CONSTRAINT') {
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('timestamp')) {
                        errorMessage = 'Ya existe un registro de asistencia para este momento';
                    } else if (err.message.includes('employee_id')) {
                        errorMessage = 'Error de duplicación con el empleado';
                    } else {
                        errorMessage = 'Ya existe un registro duplicado';
                    }
                } else if (err.message.includes('FOREIGN KEY constraint failed')) {
                    errorMessage = 'Empleado no encontrado en la base de datos';
                } else {
                    errorMessage = 'Error de restricción en la base de datos: ' + err.message;
                }
            }
            
            return res.status(500).json({ error: errorMessage });
        }
        
        console.log('✅ Asistencia registrada correctamente:', {
            id: this.lastID,
            employeeId,
            type,
            timestamp,
            photoPath,
            latitude,
            longitude
        });
        
        res.json({ 
            message: 'Asistencia registrada correctamente',
            id: this.lastID,
            timestamp: timestamp
        });
    });
});

app.get('/api/attendance', authenticateToken, (req, res) => {
    const employeeId = req.user.id;
    console.log('📡 Petición a /api/attendance desde usuario:', req.user.email, 'ID:', employeeId, 'rol:', req.user.role);
    
    database.all(`
        SELECT a.*, e.name as employee_name 
        FROM attendance a 
        JOIN employees e ON a.employee_id = e.id 
        WHERE a.employee_id = ? 
        ORDER BY a.timestamp DESC
    `, [employeeId], (err, rows) => {
        if (err) {
            console.error('❌ Error en /api/attendance:', err);
            return res.status(500).json({ error: 'Error al obtener registros' });
        }
        console.log('📋 Registros encontrados para usuario', req.user.email, ':', rows.length);
        console.log('📋 Datos:', rows);
        res.json(rows);
    });
});

app.get('/api/admin/employees', authenticateToken, (req, res) => {
    console.log('📡 Petición a /api/admin/employees desde usuario:', req.user.email, 'rol:', req.user.role);
    
    if (req.user.role !== 'admin') {
        console.log('❌ Usuario no autorizado:', req.user.role);
        return res.status(403).json({ error: 'No autorizado' });
    }

    database.all("SELECT id, name, email, position, role, created_at FROM employees", (err, rows) => {
        if (err) {
            console.error('❌ Error en base de datos:', err);
            return res.status(500).json({ error: 'Error al obtener empleados' });
        }
        
        console.log('👥 Empleados encontrados:', rows.length);
        console.log('📋 Datos:', JSON.stringify(rows, null, 2));
        
        res.json(rows);
    });
});

app.get('/api/admin/attendance', authenticateToken, (req, res) => {
    console.log('📡 Petición a /api/admin/attendance desde usuario:', req.user.email, 'rol:', req.user.role);
    
    if (req.user.role !== 'admin') {
        console.log('❌ Usuario no autorizado para ver todos los registros:', req.user.role);
        return res.status(403).json({ error: 'No autorizado' });
    }

    database.all(`
        SELECT a.*, e.name as employee_name, e.position 
        FROM attendance a 
        JOIN employees e ON a.employee_id = e.id 
        ORDER BY a.timestamp DESC
    `, (err, rows) => {
        if (err) {
            console.error('❌ Error en base de datos al obtener todos los registros:', err);
            return res.status(500).json({ error: 'Error al obtener registros' });
        }
        
        console.log('📋 Registros de asistencia encontrados:', rows.length);
        console.log('📊 Primeros 3 registros:', rows.slice(0, 3).map(r => ({
            id: r.id,
            employee_name: r.employee_name,
            type: r.type,
            timestamp: r.timestamp
        })));
        
        res.json(rows);
    });
});

app.post('/api/admin/employees', authenticateToken, (req, res) => {
    console.log('🚀 Petición para crear nuevo empleado');
    console.log('👤 Usuario solicitante:', req.user.email, 'rol:', req.user.role);
    console.log('📋 Datos recibidos:', {
        name: req.body.name,
        email: req.body.email,
        position: req.body.position,
        password: req.body.password ? 'proporcionada' : 'no proporcionada'
    });
    
    if (req.user.role !== 'admin') {
        console.log('❌ Usuario no autorizado para crear empleados:', req.user.role);
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { name, email, password, position } = req.body;
    
    // Validaciones
    if (!name || !email || !password) {
        console.error('❌ Datos incompletos:', { name: !!name, email: !!email, password: !!password });
        return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }
    
    if (password.length < 6) {
        console.error('❌ Contraseña demasiado corta');
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    console.log('🔐 Encriptando contraseña...');
    const hashedPassword = bcrypt.hashSync(password, 10);

    database.run(`
        INSERT INTO employees (name, email, password, position) 
        VALUES (?, ?, ?, ?)
    `, [name, email, hashedPassword, position || 'Jefe'], function(err) {
        if (err) {
            console.error('❌ Error al crear empleado:', err);
            
            // Manejar errores específicos de SQLite
            let errorMessage = 'Error al crear empleado';
            if (err.code === 'SQLITE_CONSTRAINT') {
                if (err.message.includes('UNIQUE constraint failed: employees.email')) {
                    errorMessage = 'El email ya está registrado';
                } else if (err.message.includes('UNIQUE constraint failed')) {
                    errorMessage = 'Ya existe un empleado con estos datos';
                } else {
                    errorMessage = 'Error de restricción en la base de datos';
                }
            }
            
            return res.status(400).json({ error: errorMessage });
        }
        
        console.log('✅ Empleado creado exitosamente:', {
            id: this.lastID,
            name: name,
            email: email,
            position: position || 'Jefe'
        });
        
        res.json({ 
            message: 'Empleado creado correctamente',
            id: this.lastID 
        });
    });
});

// Eliminar registro de asistencia individual
app.delete('/attendance/:id', (req, res) => {
    const { id } = req.params;
    
    database.run(
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
            database.run(
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
    
    console.log('🗑️ Solicitud DELETE para eliminar empleado:', {
        id: id,
        params: req.params,
        body: req.body,
        headers: req.headers
    });
    
    // Verificar que el ID sea válido
    if (!id || isNaN(id)) {
        console.error('❌ ID inválido:', id);
        return res.status(400).json({ error: 'ID de empleado inválido' });
    }
    
    // Verificar que no se elimine al último administrador
    database.get('SELECT COUNT(*) as count FROM employees WHERE role = "admin"', [], (err, row) => {
        if (err) {
            console.error('Error al verificar administradores:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        console.log('📊 Conteo de administradores:', row.count);
        
        if (row.count <= 1) {
            console.log('❌ Intento eliminar último administrador');
            return res.status(400).json({ error: 'No se puede eliminar al último administrador' });
        }
        
        // Eliminar primero los registros de asistencia del empleado
        database.run('DELETE FROM attendance WHERE employee_id = ?', [id], (err) => {
            if (err) {
                console.error('❌ Error al eliminar registros de asistencia:', err);
                return res.status(500).json({ error: 'Error al eliminar registros de asistencia' });
            }
            
            console.log('✅ Registros de asistencia eliminados para empleado:', id);
            
            // Eliminar al empleado
            database.run('DELETE FROM employees WHERE id = ?', [id], (err) => {
                if (err) {
                    console.error('❌ Error al eliminar empleado:', err);
                    return res.status(500).json({ error: 'Error al eliminar empleado' });
                }
                
                console.log('✅ Empleado eliminado exitosamente:', id);
                res.json({ message: 'Empleado y sus registros eliminados exitosamente' });
            });
        });
    });
});

// Endpoint de prueba para ngrok
app.get('/api/ngrok-test', (req, res) => {
    console.log('🔍 Ngrok test endpoint llamado');
    console.log('📡 Headers:', req.headers);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('🔑 User-Agent:', req.headers['user-agent']);
    
    res.json({ 
        message: 'Ngrok connection successful',
        timestamp: new Date().toISOString(),
        headers: req.headers,
        origin: req.headers.origin
    });
});

// Ruta para registrar salida administrativa
app.post('/api/admin/admin-exit', authenticateToken, (req, res) => {
    console.log('🛡️ Recibida petición de salida administrativa desde usuario:', req.user.email, 'rol:', req.user.role);
    
    if (req.user.role !== 'admin') {
        console.log('❌ Usuario no autorizado para salida administrativa:', req.user.role);
        return res.status(403).json({ error: 'No autorizado para salida administrativa' });
    }
    
    const { employee_name, type, timestamp, reason, admin_exit } = req.body;
    
    if (!employee_name || !type || !timestamp) {
        console.error('❌ Datos incompletos para salida administrativa:', { employee_name: !!employee_name, type: !!type, timestamp: !!timestamp });
        return res.status(400).json({ error: 'Datos incompletos para salida administrativa' });
    }
    
    // Buscar ID del empleado por nombre
    database.get(
        'SELECT id FROM employees WHERE name = ?',
        [employee_name],
        (err, employee) => {
            if (err) {
                console.error('❌ Error buscando empleado:', err);
                return res.status(500).json({ error: 'Error al buscar empleado' });
            }
            
            if (!employee) {
                console.error('❌ Empleado no encontrado:', employee_name);
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }
            
            // Insertar registro de salida administrativa
            database.run(`
                INSERT INTO attendance (employee_id, type, timestamp, photo, latitude, longitude, admin_exit, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                employee.id,
                type,
                timestamp,
                null, // No hay foto para salida administrativa
                null, // No hay ubicación para salida administrativa
                admin_exit || true,
                reason || 'Salida administrativa'
            ], function(err) {
                if (err) {
                    console.error('❌ Error insertando salida administrativa:', err);
                    return res.status(500).json({ error: 'Error al registrar salida administrativa' });
                }
                
                console.log('✅ Salida administrativa registrada exitosamente para:', employee_name);
                res.json({ 
                    success: true, 
                    message: 'Salida administrativa registrada correctamente',
                    id: this.lastID 
                });
            });
        }
    );
});

// Rutas para actualizar rol y puesto de empleados
app.put('/api/admin/employees/:id/position', authenticateToken, express.json(), (req, res) => {
    console.log('📝 Recibida petición para actualizar puesto:', req.body);
    const { id } = req.params;
    const { position } = req.body;
    
    if (!position) {
        return res.status(400).json({ error: 'El puesto es requerido' });
    }
    
    database.run(
        'UPDATE employees SET position = ? WHERE id = ?',
        [position, id],
        function(err) {
            if (err) {
                console.error('❌ Error actualizando puesto:', err);
                return res.status(500).json({ error: 'Error al actualizar puesto' });
            }
            
            console.log('✅ Puesto actualizado para empleado ID:', id, 'nuevo puesto:', position);
            res.json({ message: 'Puesto actualizado correctamente' });
        }
    );
});

app.put('/api/admin/employees/:id/role', authenticateToken, express.json(), (req, res) => {
    console.log('👤 Recibida petición para actualizar rol:', req.body);
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
        return res.status(400).json({ error: 'El rol es requerido' });
    }
    
    // Validar roles permitidos
    const validRoles = ['employee', 'coordinator', 'jefe', 'ban'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Rol no válido' });
    }
    
    database.run(
        'UPDATE employees SET role = ? WHERE id = ?',
        [role, id],
        function(err) {
            if (err) {
                console.error('❌ Error actualizando rol:', err);
                return res.status(500).json({ error: 'Error al actualizar rol' });
            }
            
            console.log('✅ Rol actualizado para empleado ID:', id, 'nuevo rol:', role);
            res.json({ message: 'Rol actualizado correctamente' });
        }
    );
});

// Endpoint de health check para Docker/Producción
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Progress corriendo en http://localhost:${PORT}`);
    console.log(`Acceso desde red local: http://192.168.20.51:${PORT}`);
});

// Exportar para Vercel
module.exports = app;
