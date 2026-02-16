const { Pool } = require('pg');

// Configuración para PostgreSQL (Railway)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Función para inicializar la base de datos
async function initDatabase() {
  try {
    // Crear tablas si no existen
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        role VARCHAR(50) DEFAULT 'employee',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        employee_id INTEGER REFERENCES employees(id),
        employee_name VARCHAR(255) NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('entry', 'exit')),
        timestamp TIMESTAMP NOT NULL,
        photo_path VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        device_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Base de datos PostgreSQL inicializada');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

module.exports = { pool, initDatabase };
