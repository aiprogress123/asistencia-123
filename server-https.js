const https = require('https');
const fs = require('fs');
const path = require('path');

// Importar el servidor original
require('./server.js');

// Crear certificado autofirmado para desarrollo
const options = {
    key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost-cert.pem'))
};

// Crear servidor HTTPS
const httpsServer = https.createServer(options, (req, res) => {
    // Redirigir todas las peticiones al servidor original
    req.pipe(require('http').request({
        hostname: 'localhost',
        port: 3000,
        path: req.url,
        method: req.method,
        headers: req.headers
    }, (response) => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
    }));
});

httpsServer.listen(3443, () => {
    console.log('🔒 Servidor HTTPS corriendo en https://localhost:3443');
    console.log('📝 Certificado autofirmado para desarrollo');
});
