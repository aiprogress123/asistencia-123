// Script simple para iniciar el servidor original
const { spawn } = require('child_process');

console.log('🚀 Iniciando servidor original...');
const child = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
});

child.on('error', (error) => {
    console.error('❌ Error al iniciar servidor:', error);
});

child.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ Servidor terminó con código: ${code}`);
    } else {
        console.log('✅ Servidor iniciado correctamente');
    }
});
