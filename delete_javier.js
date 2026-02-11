const sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('progress_assistance.db');

// Eliminar al empleado llamado 'Javier'
db.run('DELETE FROM employees WHERE name = ?', ['Javier'], function(err) {
    if (err) {
        console.error('Error al eliminar empleado:', err);
    } else {
        console.log(`Empleado Javier eliminado: ${this.changes} fila(s) afectada(s)`);
    }
    
    // Cerrar la conexión
    db.close();
});
