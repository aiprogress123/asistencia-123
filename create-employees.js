const fetch = require('node-fetch');

const API_BASE = 'https://asistencia-production-f894.up.railway.app/api';

async function createEmployees() {
    console.log('🔄 Creando empleados...');
    
    try {
        // Login como admin
        const loginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@progress.com',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('✅ Login exitoso:', loginData.user.name);
        
        const token = loginData.token;
        
        // Crear empleados
        const employees = [
            { name: 'Javier Martinez', email: 'javier@progress.com', role: 'employee' },
            { name: 'Luis Rodriguez', email: 'luis@progress.com', role: 'employee' },
            { name: 'Maria Garcia', email: 'maria@progress.com', role: 'employee' },
            { name: 'Carlos Lopez', email: 'carlos@progress.com', role: 'coordinator' },
            { name: 'Ana Sanchez', email: 'ana@progress.com', role: 'employee' },
            { name: 'Pedro Diaz', email: 'pedro@progress.com', role: 'employee' }
        ];
        
        for (const emp of employees) {
            const createResponse = await fetch(`${API_BASE}/admin/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...emp,
                    password: 'emp123'
                })
            });
            
            if (createResponse.ok) {
                console.log(`✅ Empleado creado: ${emp.name}`);
            } else {
                console.log(`❌ Error creando ${emp.name}:`, await createResponse.text());
            }
        }
        
        // Verificar empleados creados
        const listResponse = await fetch(`${API_BASE}/admin/employees`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const employeesList = await listResponse.json();
        console.log(`📊 Total empleados: ${employeesList.length}`);
        employeesList.forEach(emp => {
            console.log(`  - ${emp.name} (${emp.role})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createEmployees();
