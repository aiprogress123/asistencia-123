const sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos local
const localDb = new sqlite3.Database('./progress.db');

// Conectar a la base de datos de Railway
const railwayDb = new sqlite3.Database('/tmp/progress.db');

console.log('🔄 Iniciando migración de datos...');

// Migrar usuarios
localDb.all('SELECT * FROM users', (err, users) => {
    if (err) {
        console.error('❌ Error leyendo usuarios locales:', err);
        process.exit(1);
    }
    
    console.log(`👥 Encontrados ${users.length} usuarios para migrar`);
    
    railwayDb.serialize(() => {
        railwayDb.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'employee',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            
            railwayDb.run(`CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER,
                employee_name TEXT,
                type TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                photo_path TEXT,
                latitude REAL,
                longitude REAL,
                FOREIGN KEY (employee_id) REFERENCES users (id)
            )`, () => {
                
                // Insertar usuarios
                const stmt = railwayDb.prepare('INSERT OR REPLACE INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)');
                
                users.forEach(user => {
                    stmt.run([user.id, user.name, user.email, user.password, user.role, user.created_at]);
                    console.log(`✅ Usuario migrado: ${user.name} (${user.role})`);
                });
                
                stmt.finalize(() => {
                    console.log('✅ Usuarios migrados correctamente');
                    
                    // Migrar registros de asistencia
                    localDb.all('SELECT * FROM attendance', (err, records) => {
                        if (err) {
                            console.error('❌ Error leyendo registros locales:', err);
                            process.exit(1);
                        }
                        
                        console.log(`📊 Encontrados ${records.length} registros para migrar`);
                        
                        const stmt2 = railwayDb.prepare('INSERT INTO attendance (id, employee_id, employee_name, type, timestamp, photo_path, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                        
                        records.forEach(record => {
                            stmt2.run([record.id, record.employee_id, record.employee_name, record.type, record.timestamp, record.photo_path, record.latitude, record.longitude]);
                            console.log(`✅ Registro migrado: ${record.employee_name} - ${record.type}`);
                        });
                        
                        stmt2.finalize(() => {
                            console.log('✅ Registros migrados correctamente');
                            console.log('🎉 Migración completada');
                            
                            localDb.close();
                            railwayDb.close();
                        });
                    });
                });
            });
        });
    });
});
