const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/admin/attendance', (req, res) => {
    console.log('Recibida solicitud de salida administrativa:', req.body);
    res.json({ 
        message: 'Asistencia registrada administrativamente correctamente',
        id: 1,
        timestamp: new Date().toISOString(),
        employee: req.body.employee_name,
        registered_by: 'admin'
    });
});

app.listen(PORT, () => {
    console.log('Servidor mínimo corriendo en http://localhost:3000');
});
