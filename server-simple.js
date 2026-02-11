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
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
    }
});

const upload = multer({ storage: storage });

// Conexión a la base de datos
const db = new sqlite3.Database('progress_net_assistance.db');

// Crear tablas y usuario admin
db.serialize(() => {
    console.log('Creando tablas...');
    
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
        type TEXT NOT NULL,
        photo_path TEXT,
        latitude REAL,
        longitude REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
    )`, (err) => {
        if (err) console.error('Error creando tabla attendance:', err);
    });

    // Verificar si existe admin
    db.get("SELECT COUNT(*) as count FROM employees WHERE role = 'admin'", (err, row) => {
        if (err) {
            console.error('Error verificando admin:', err);
            return;
        }
        
        console.log('Admin count:', row.count);
        
        if (row.count === 0) {
            console.log('Creando usuario admin...');
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.run(`
                INSERT INTO employees (name, email, password, role) 
                VALUES ('Administrador', 'admin@progress.com', ?, 'admin')
            `, [hashedPassword], function(err) {
                if (err) {
                    console.error('Error creando admin:', err);
                } else {
                    console.log('Usuario admin creado con ID:', this.lastID);
                }
            });
        }
    });

    // Verificar si existe coordinador
    db.get("SELECT COUNT(*) as count FROM employees WHERE role = 'coordinator'", (err, row) => {
        if (err) {
            console.error('Error verificando coordinador:', err);
            return;
        }
        
        console.log('Coordinador count:', row.count);
        
        if (row.count === 0) {
            console.log('Creando usuario coordinador...');
            const hashedPassword = bcrypt.hashSync('coord123', 10);
            db.run(`
                INSERT INTO employees (name, email, password, position, role) 
                VALUES ('Coordinador', 'coordinador@progress.com', ?, 'Coordinador', 'coordinator')
            `, [hashedPassword], function(err) {
                if (err) {
                    console.error('Error creando coordinador:', err);
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        console.log('El coordinador ya existe en la base de datos');
                    }
                } else {
                    console.log('Usuario coordinador creado con ID:', this.lastID);
                }
            });
        } else {
            console.log('Usuario coordinador ya existe');
        }
    });
});

// Ruta de login
app.post('/api/login', (req, res) => {
    console.log('Intento de login:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y password requeridos' });
    }

    db.get("SELECT * FROM employees WHERE email = ?", [email], (err, user) => {
        if (err) {
            console.error('Error en consulta:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        console.log('Usuario encontrado:', user ? 'Sí' : 'No');

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login exitoso para:', user.email);

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

// Middleware para verificar token
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

// Rutas de empleados
app.get('/api/admin/employees', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    db.all("SELECT id, name, email, position, role, created_at FROM employees", (err, rows) => {
        if (err) {
            console.error('Error obteniendo empleados:', err);
            return res.status(500).json({ error: 'Error al obtener empleados' });
        }
        res.json(rows);
    });
});

app.post('/api/admin/employees', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado - Solo administradores pueden crear empleados' });
    }

    const { name, email, password, position } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y password son requeridos' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run(`
        INSERT INTO employees (name, email, password, position) 
        VALUES (?, ?, ?, ?)
    `, [name, email, hashedPassword, position], function(err) {
        if (err) {
            console.error('Error creando empleado:', err);
            return res.status(500).json({ error: 'Error al crear empleado' });
        }
        
        res.json({ 
            message: 'Empleado creado correctamente',
            id: this.lastID 
        });
    });
});

app.delete('/api/admin/employees/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const employeeId = req.params.id;
    
    db.run("DELETE FROM employees WHERE id = ?", [employeeId], function(err) {
        if (err) {
            console.error('Error eliminando empleado:', err);
            return res.status(500).json({ error: 'Error al eliminar empleado' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        res.json({ message: 'Empleado eliminado correctamente' });
    });
});

// Ruta para actualizar nombre de empleado
app.put('/api/admin/employees/:id/name', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado - Solo administradores pueden cambiar nombres' });
    }

    const employeeId = req.params.id;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    // No permitir que el admin cambie su propio nombre
    if (req.user.userId == employeeId) {
        return res.status(400).json({ error: 'No puedes cambiar tu propio nombre' });
    }

    db.run("UPDATE employees SET name = ? WHERE id = ?", [name.trim(), employeeId], function(err) {
        if (err) {
            console.error('Error actualizando nombre:', err);
            return res.status(500).json({ error: 'Error al actualizar nombre' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        res.json({ 
            message: 'Nombre actualizado correctamente',
            employeeId: employeeId,
            newName: name.trim()
        });
    });
});

// Ruta para actualizar rol de empleado
app.put('/api/admin/employees/:id/role', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No autorizado - Solo administradores pueden cambiar roles' });
    }

    const employeeId = req.params.id;
    const { role } = req.body;
    
    // Validar que el rol sea válido
    const validRoles = ['employee', 'coordinator', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Rol inválido. Roles válidos: employee, coordinator, admin' });
    }
    
    // No permitir que el admin cambie su propio rol
    if (req.user.userId == employeeId) {
        return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    db.run("UPDATE employees SET role = ? WHERE id = ?", [role, employeeId], function(err) {
        if (err) {
            console.error('Error actualizando rol:', err);
            return res.status(500).json({ error: 'Error al actualizar rol' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        res.json({ 
            message: 'Rol actualizado correctamente',
            employeeId: employeeId,
            newRole: role
        });
    });
});

// Ruta para registrar asistencia con foto
app.post('/api/attendance', authenticateToken, upload.single('photo'), (req, res) => {
    const { type, latitude, longitude } = req.body;
    const employeeId = req.user.userId || req.user.id; // Corregir para usar el ID correcto
    const photoPath = req.file ? req.file.filename : null;

    console.log('Datos de asistencia:', { employeeId, type, latitude, longitude, photoPath, user: req.user });

    if (!employeeId) {
        return res.status(400).json({ error: 'ID de empleado no encontrado' });
    }

    // Obtener fecha y hora actual en zona horaria de Colombia
    const now = new Date();
    const colombiaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    
    // Formatear timestamp para base de datos
    const timestamp = colombiaTime.toISOString();

    db.run(`
        INSERT INTO attendance (employee_id, type, photo_path, latitude, longitude, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?)
    `, [employeeId, type, photoPath, latitude, longitude, timestamp], function(err) {
        if (err) {
            console.error('Error registrando asistencia:', err);
            return res.status(500).json({ error: 'Error al registrar asistencia' });
        }
        
        res.json({ 
            message: 'Asistencia registrada correctamente',
            id: this.lastID,
            timestamp: timestamp
        });
    });
});

// Rutas de asistencia
app.get('/api/attendance', authenticateToken, (req, res) => {
    const employeeId = req.user.userId || req.user.id;
    
    db.all(`
        SELECT a.*, e.name as employee_name 
        FROM attendance a 
        JOIN employees e ON a.employee_id = e.id 
        WHERE a.employee_id = ? 
        ORDER BY a.timestamp DESC
    `, [employeeId], (err, rows) => {
        if (err) {
            console.error('Error obteniendo asistencia:', err);
            return res.status(500).json({ error: 'Error al obtener registros' });
        }
        console.log('Registros obtenidos para empleado', employeeId, ':', rows.length);
        res.json(rows);
    });
});

app.get('/api/admin/attendance', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    db.all(`
        SELECT a.*, e.name as employee_name, e.position 
        FROM attendance a 
        JOIN employees e ON a.employee_id = e.id 
        ORDER BY a.timestamp DESC
    `, (err, rows) => {
        if (err) {
            console.error('Error obteniendo asistencia admin:', err);
            return res.status(500).json({ error: 'Error al obtener registros' });
        }
        res.json(rows);
    });
});

app.delete('/api/attendance/:id', authenticateToken, (req, res) => {
    const recordId = req.params.id;
    const employeeId = req.user.userId || req.user.id;
    
    db.run("DELETE FROM attendance WHERE id = ? AND employee_id = ?", [recordId, employeeId], function(err) {
        if (err) {
            console.error('Error eliminando registro:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        res.json({ message: 'Registro eliminado exitosamente' });
    });
});

app.delete('/api/attendance/all', authenticateToken, (req, res) => {
    const employeeId = req.user.userId || req.user.id;
    
    db.run("DELETE FROM attendance WHERE employee_id = ?", [employeeId], function(err) {
        if (err) {
            console.error('Error eliminando todos los registros:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        res.json({ message: 'Todos los registros eliminados exitosamente' });
    });
});

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Iniciar servidor
app.listen(PORT, () => {
    console.log('Servidor corriendo en http://localhost:3000');
    console.log('Usuario admin: admin@progress.com / admin123');
    console.log('Usuario coordinador: coordinador@progress.com / coord123');
});
