// Progress Assistance System - Versión de Producción
console.log('🚀 Progress Assistance System - Iniciando versión de producción...');
console.log('🌐 Modo: Local/Producción');
console.log('📅 Fecha:', new Date().toLocaleString('es-CO'));

let currentUser = null;
let currentLocation = null;
let cameraStream = null;
let photoData = null;
let currentCamera = 'user';
let availableCameras = [];

// Configuración de zona horaria para Colombia
const TIMEZONE = 'America/Bogota';

// API_BASE para entorno local únicamente
const getApiBase = () => {
    console.log('🔍 Configurando API_BASE para entorno local...');
    console.log('🌐 Hostname:', window.location.hostname);
    return 'http://localhost:3000/api';
};

const API_BASE = getApiBase();

console.log('🌐 API_BASE configurada:', API_BASE);

// Función para validar email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para mostrar alertas personalizadas
function showCustomAlert(title, message, type = 'info') {
    const modalHtml = `
        <div id="customAlertModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                background: ${type === 'danger' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
                color: white;
                padding: 2rem;
                border-radius: 10px;
                max-width: 400px;
                text-align: center;
            ">
                <h5>${title}</h5>
                <p>${message}</p>
                <button onclick="closeCustomAlert()" style="
                    background: white;
                    color: ${type === 'danger' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 5px;
                    cursor: pointer;
                ">OK</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeCustomAlert() {
    const modal = document.getElementById('customAlertModal');
    if (modal) modal.remove();
}

// Login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showCustomAlert('❌ Error', 'Por favor completa todos los campos', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            loginSuccess(data.user, data.token);
        } else {
            showCustomAlert('❌ Error', data.error || 'Credenciales incorrectas', 'danger');
        }
    } catch (error) {
        showCustomAlert('❌ Error', 'No se pudo conectar con el servidor', 'danger');
    }
});

function loginSuccess(user, token) {
    currentUser = user;
    localStorage.setItem('progressToken', token);
    localStorage.setItem('progressUser', JSON.stringify(user));
    
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    
    if (user.role === 'admin') {
        document.getElementById('adminSection').classList.remove('hidden');
        loadEmployees();
    } else {
        document.getElementById('employeeSection').classList.remove('hidden');
        loadTodayAttendance();
    }
}

function logout() {
    localStorage.removeItem('progressToken');
    localStorage.removeItem('progressUser');
    currentUser = null;
    
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
}

// Funciones principales
async function loadEmployees() {
    try {
        const response = await fetch(`${API_BASE}/admin/employees`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });
        
        if (response.ok) {
            const employees = await response.json();
            displayEmployees(employees);
        }
    } catch (error) {
        console.error('Error cargando empleados:', error);
    }
}

function displayEmployees(employees) {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    
    let html = '';
    employees.forEach(emp => {
        html += `
            <tr>
                <td>${emp.id}</td>
                <td>${emp.name}</td>
                <td>${emp.email}</td>
                <td><span class="badge bg-${emp.role === 'admin' ? 'danger' : emp.role === 'coordinator' ? 'warning' : 'primary'}">${emp.role}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editEmployee(${emp.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${emp.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function showAllAttendance() {
    console.log('🔄 Mostrando sección de todos los registros');
    
    const employeesSection = document.getElementById('employeesSection');
    const attendanceSection = document.getElementById('attendanceSection');
    
    if (employeesSection) employeesSection.classList.add('hidden');
    if (attendanceSection) attendanceSection.classList.remove('hidden');
    
    loadAllRecordsDirectly();
}

async function loadAllRecordsDirectly() {
    try {
        const response = await fetch(`${API_BASE}/admin/attendance`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });
        
        if (response.ok) {
            const records = await response.json();
            displayAllRecords(records);
        }
    } catch (error) {
        console.error('Error cargando registros:', error);
    }
}

function displayAllRecords(records) {
    const container = document.getElementById('attendanceTableBody');
    if (!container) return;
    
    if (records.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros</td></tr>';
        return;
    }
    
    let html = '';
    records.forEach(record => {
        const typeClass = record.type === 'entry' ? 'success' : 'danger';
        const typeIcon = record.type === 'entry' ? 'fa-sign-in-alt' : 'fa-sign-out-alt';
        const typeText = record.type === 'entry' ? 'Entrada' : 'Salida';
        
        const date = new Date(record.timestamp);
        const dateStr = date.toLocaleDateString('es-CO');
        const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        
        let photoUrl = '';
        if (record.photo_path) {
            photoUrl = `http://localhost:3000/${record.photo_path}`;
        }
        
        html += `
            <tr>
                <td>${record.employee_name || 'N/A'}</td>
                <td><span class="badge bg-${typeClass}">${typeText}</span></td>
                <td>${dateStr} ${timeStr}</td>
                <td>
                    ${photoUrl ? 
                        `<img src="${photoUrl}" alt="Foto" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px;">` : 
                        'Sin foto'
                    }
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showRecordDetails(${record.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
}

function showEmployees() {
    document.getElementById('employeesSection').classList.remove('hidden');
    document.getElementById('attendanceSection').classList.add('hidden');
    loadEmployees();
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('progressToken');
    if (token) {
        const user = JSON.parse(localStorage.getItem('progressUser'));
        loginSuccess(user, token);
    }
});
