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

// API_BASE para producción con fallback
const getApiBase = () => {
    console.log('🔍 Configurando API_BASE...');
    console.log('🌐 Hostname:', window.location.hostname);
    
    // Si estamos en Vercel producción
    if (window.location.hostname.includes('vercel.app')) {
        console.log('📍 Entorno Vercel detectado');
        return 'http://localhost:3000/api'; // Backend local
    }
    
    // Si estamos en desarrollo local
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
        console.log('📍 Entorno local detectado');
        return 'http://localhost:3000/api';
    }
    
    // Para cualquier otro entorno
    console.log('📍 Entorno producción detectado');
    return 'http://localhost:3000/api'; // Temporal: backend local
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
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    if (user.role === 'admin') {
        document.getElementById('adminView').classList.remove('hidden');
        document.getElementById('employeeView').classList.add('hidden');
        loadEmployees();
    } else {
        document.getElementById('employeeView').classList.remove('hidden');
        document.getElementById('adminView').classList.add('hidden');
        loadTodayAttendance();
    }
}

function logout() {
    localStorage.removeItem('progressToken');
    localStorage.removeItem('progressUser');
    currentUser = null;
    
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

// Funciones principales
async function loadEmployees() {
    console.log('🔄 Iniciando carga de empleados...');
    try {
        const response = await fetch(`${API_BASE}/admin/employees`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });
        
        console.log('📥 Respuesta de empleados:', {
            status: response.status,
            ok: response.ok
        });
        
        if (response.ok) {
            const employees = await response.json();
            console.log('👥 Empleados recibidos:', employees.length, 'empleados');
            displayEmployees(employees);
        } else {
            console.error('❌ Error en respuesta de empleados:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error cargando empleados:', error);
    }
}

function displayEmployees(employees) {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    
    console.log('🔍 Verificando funciones disponibles:', {
        updatePosition: typeof window.updatePosition,
        updateRole: typeof window.updateRole,
        togglePositionEdit: typeof window.togglePositionEdit,
        toggleRoleEdit: typeof window.toggleRoleEdit
    });
    
    let html = '';
    employees.forEach(emp => {
        const positionId = `position-${emp.id}`;
        const positionInputId = `position-input-${emp.id}`;
        const positionActionsId = `position-actions-${emp.id}`;
        const roleId = `role-${emp.id}`;
        const roleSelectId = `role-select-${emp.id}`;
        const roleActionsId = `role-actions-${emp.id}`;
        
        html += `
            <tr>
                <td>${emp.id}</td>
                <td>${emp.name}</td>
                <td>${emp.email}</td>
                <td>
                    <span class="position-text" id="${positionId}">${emp.position || 'No especificado'}</span>
                    <div class="position-actions" id="${positionActionsId}" style="display: none;">
                        <input type="text" class="form-control form-control-sm" id="${positionInputId}" value="${emp.position || ''}" placeholder="Nuevo puesto">
                        <button class="btn btn-sm btn-success" onclick="updatePosition('${emp.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="cancelPositionEdit('${emp.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <span class="badge bg-${emp.role === 'jefe' ? 'danger' : emp.role === 'coordinator' ? 'warning' : emp.role === 'ban' ? 'dark' : 'primary'}" id="${roleId}">${emp.role === 'jefe' ? 'Jefe' : emp.role === 'coordinator' ? 'Coordinador' : emp.role === 'ban' ? 'Van' : 'Empleado'}</span>
                    <div class="role-actions" id="${roleActionsId}" style="display: none;">
                        <select class="form-select form-select-sm" id="${roleSelectId}">
                            <option value="employee" ${emp.role === 'employee' ? 'selected' : ''}>Empleado</option>
                            <option value="coordinator" ${emp.role === 'coordinator' ? 'selected' : ''}>Coordinador</option>
                            <option value="jefe" ${emp.role === 'jefe' ? 'selected' : ''}>Jefe</option>
                            <option value="ban" ${emp.role === 'ban' ? 'selected' : ''}>Van</option>
                        </select>
                        <button class="btn btn-sm btn-success" onclick="updateRole('${emp.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="cancelRoleEdit('${emp.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-primary dropdown-toggle" type="button" id="actionDropdown${emp.id}" data-bs-toggle="dropdown">
                            <i class="fas fa-cog"></i> Acciones
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="actionDropdown${emp.id}">
                            <li>
                                <a class="dropdown-item" href="#" onclick="editEmployee('${emp.id}')">
                                    <i class="fas fa-edit text-primary me-2"></i>Editar Empleado
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" onclick="togglePositionEdit('${emp.id}')">
                                    <i class="fas fa-briefcase text-warning me-2"></i>Cambiar Puesto
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" onclick="toggleRoleEdit('${emp.id}')">
                                    <i class="fas fa-user-tag text-info me-2"></i>Cambiar Rol
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" onclick="deleteEmployee('${emp.id}')">
                                    <i class="fas fa-trash me-2"></i>Eliminar Empleado
                                </a>
                            </li>
                        </ul>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Funciones para edición rápida de rol y puesto
function togglePositionEdit(employeeId) {
    const positionText = document.getElementById(`position-${employeeId}`);
    const positionActions = document.getElementById(`position-actions-${employeeId}`);
    
    if (positionActions.style.display === 'none') {
        positionText.style.display = 'none';
        positionActions.style.display = 'block';
    } else {
        positionText.style.display = 'inline';
        positionActions.style.display = 'none';
    }
}

function cancelPositionEdit(employeeId) {
    const positionText = document.getElementById(`position-${employeeId}`);
    const positionActions = document.getElementById(`position-actions-${employeeId}`);
    
    positionText.style.display = 'inline';
    positionActions.style.display = 'none';
}

async function updatePosition(employeeId) {
    const newPosition = document.getElementById(`position-input-${employeeId}`).value;
    
    console.log('🔄 Actualizando puesto:', {
        employeeId,
        newPosition,
        inputElement: `position-input-${employeeId}`,
        inputExists: !!document.getElementById(`position-input-${employeeId}`),
        inputValue: document.getElementById(`position-input-${employeeId}`)?.value
    });
    
    if (!newPosition.trim()) {
        showCustomAlert('❌ Error', 'El puesto no puede estar vacío', 'danger');
        return;
    }
    
    try {
        const requestBody = JSON.stringify({ position: newPosition.trim() });
        console.log('📤 Enviando solicitud:', {
            url: `${API_BASE}/admin/employees/${employeeId}/position`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: requestBody
        });
        
        const response = await fetch(`${API_BASE}/admin/employees/${employeeId}/position`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: requestBody
        });
        
        console.log('📥 Respuesta recibida:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        });
        
        if (response.ok) {
            showCustomAlert('✅ Éxito', 'Puesto actualizado correctamente', 'success');
            loadEmployees(); // Recargar la tabla
        } else {
            const error = await response.text();
            console.log('❌ Error del servidor:', error);
            showCustomAlert('❌ Error', error, 'danger');
        }
    } catch (error) {
        console.error('Error actualizando puesto:', error);
        showCustomAlert('❌ Error', 'No se pudo actualizar el puesto', 'danger');
    }
}

function toggleRoleEdit(employeeId) {
    const roleText = document.getElementById(`role-${employeeId}`);
    const roleActions = document.getElementById(`role-actions-${employeeId}`);
    
    if (roleActions.style.display === 'none') {
        roleText.style.display = 'none';
        roleActions.style.display = 'block';
    } else {
        roleText.style.display = 'inline';
        roleActions.style.display = 'none';
    }
}

function cancelRoleEdit(employeeId) {
    const roleText = document.getElementById(`role-${employeeId}`);
    const roleActions = document.getElementById(`role-actions-${employeeId}`);
    
    roleText.style.display = 'inline';
    roleActions.style.display = 'none';
}

async function updateRole(employeeId) {
    const newRole = document.getElementById(`role-select-${employeeId}`).value;
    
    console.log('🔄 Actualizando rol:', {
        employeeId,
        newRole,
        selectElement: `role-select-${employeeId}`,
        selectExists: !!document.getElementById(`role-select-${employeeId}`),
        selectValue: document.getElementById(`role-select-${employeeId}`)?.value
    });
    
    try {
        const requestBody = JSON.stringify({ role: newRole });
        console.log('📤 Enviando solicitud de rol:', {
            url: `${API_BASE}/admin/employees/${employeeId}/role`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: requestBody
        });
        
        const response = await fetch(`${API_BASE}/admin/employees/${employeeId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: requestBody
        });
        
        console.log('📥 Respuesta de rol:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        });
        
        if (response.ok) {
            showCustomAlert('✅ Éxito', 'Rol actualizado correctamente', 'success');
            console.log('✅ Llamando a loadEmployees() después de actualizar rol');
            loadEmployees(); // Recargar la tabla
        } else {
            const error = await response.text();
            console.log('❌ Error del servidor al actualizar rol:', error);
            showCustomAlert('❌ Error', error, 'danger');
        }
    } catch (error) {
        console.error('Error actualizando rol:', error);
        showCustomAlert('❌ Error', 'No se pudo actualizar el rol', 'danger');
    }
}

function showAllAttendance() {
    console.log('🔄 Mostrando sección de todos los registros');
    
    const employeesSection = document.getElementById('employeesSection');
    const attendanceSection = document.getElementById('attendanceSection');
    
    if (employeesSection) employeesSection.classList.add('hidden');
    if (attendanceSection) attendanceSection.classList.remove('hidden');
    
    loadAllRecordsDirectly();
}

// Registrar funciones globalmente
window.updatePosition = updatePosition;
window.updateRole = updateRole;
window.togglePositionEdit = togglePositionEdit;
window.toggleRoleEdit = toggleRoleEdit;
window.cancelPositionEdit = cancelPositionEdit;
window.cancelRoleEdit = cancelRoleEdit;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.addEmployee = addEmployee;
window.showAddEmployee = showAddEmployee;
window.showAllAttendance = showAllAttendance;
window.recordAttendance = recordAttendance;
window.capturePhoto = capturePhoto;
window.showAdminExitSelection = showAdminExitSelection;

console.log('✅ Funciones registradas globalmente');

function showAdminExitSelection() {
    // Obtener lista de empleados
    fetch(`${API_BASE}/admin/employees`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
        }
    })
    .then(response => response.json())
    .then(employees => {
        const modalHtml = `
            <div class="modal fade" id="adminExitSelectionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user-shield me-2"></i>
                                Registrar Salida Administrativa
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Selecciona el empleado y la fecha para registrar una salida administrativa.
                            </div>
                            
                            <form id="adminExitSelectionForm">
                                <div class="mb-3">
                                    <label for="employeeSelect" class="form-label">
                                        <i class="fas fa-user me-1"></i>
                                        Seleccionar Empleado
                                    </label>
                                    <select class="form-control" id="employeeSelect" required>
                                        <option value="">Selecciona un empleado...</option>
                                        ${employees.map(emp => `
                                            <option value="${emp.name}">${emp.name} - ${emp.position || 'Sin puesto'}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="exitDate" class="form-label">
                                        <i class="fas fa-calendar me-1"></i>
                                        Fecha de Salida
                                    </label>
                                    <input type="date" 
                                           class="form-control" 
                                           id="exitDate" 
                                           required
                                           max="${new Date().toISOString().split('T')[0]}"
                                           value="${new Date().toISOString().split('T')[0]}">
                                </div>
                                
                                <div class="mb-3">
                                    <label for="exitTime" class="form-label">
                                        <i class="fas fa-clock me-1"></i>
                                        Hora de Salida
                                    </label>
                                    <input type="time" 
                                           class="form-control" 
                                           id="exitTime" 
                                           required
                                           value="${new Date().toTimeString().slice(0, 5)}">
                                </div>
                                
                                <div class="mb-3">
                                    <label for="exitReason" class="form-label">
                                        <i class="fas fa-comment me-1"></i>
                                        Motivo (opcional)
                                    </label>
                                    <textarea class="form-control" 
                                              id="exitReason" 
                                              rows="3"
                                              placeholder="Motivo de la salida administrativa..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-warning" onclick="processAdminExit()">
                                <i class="fas fa-user-shield me-1"></i>
                                Registrar Salida
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar modal en el DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('adminExitSelectionModal'));
        modal.show();
        
        // Limpiar modal al cerrar
        document.getElementById('adminExitSelectionModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    })
    .catch(error => {
        console.error('Error cargando empleados:', error);
        showCustomAlert('❌ Error', 'No se pudieron cargar los empleados', 'danger');
    });
}

function processAdminExit() {
    const employeeName = document.getElementById('employeeSelect').value;
    const exitDate = document.getElementById('exitDate').value;
    const exitTime = document.getElementById('exitTime').value;
    const exitReason = document.getElementById('exitReason').value;
    
    if (!employeeName || !exitDate || !exitTime) {
        showCustomAlert('❌ Error', 'Por favor completa todos los campos requeridos', 'danger');
        return;
    }
    
    const exitDateTime = new Date(`${exitDate}T${exitTime}`);
    
    // Crear registro de salida administrativa
    const adminExitData = {
        employee_name: employeeName,
        type: 'exit',
        timestamp: exitDateTime.toISOString(),
        reason: exitReason || 'Salida administrativa',
        admin_exit: true,
        photo: null, // No se requiere foto para salida administrativa
        latitude: null,
        longitude: null
    };
    
    fetch(`${API_BASE}/admin/admin-exit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
        },
        body: JSON.stringify(adminExitData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showCustomAlert('❌ Error', data.error, 'danger');
        } else {
            showCustomAlert('✅ Éxito', 'Salida administrativa registrada correctamente', 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('adminExitSelectionModal'));
            modal.hide();
            
            // Recargar registros
            if (typeof loadAllAttendance === 'function') {
                loadAllAttendance();
            }
        }
    })
    .catch(error => {
        console.error('Error registrando salida administrativa:', error);
        showCustomAlert('❌ Error', 'No se pudo registrar la salida administrativa', 'danger');
    });
}

function displayAttendanceRecords(records) {
    const container = document.getElementById('attendanceRecords');
    
    if (records.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay registros de asistencia</p>';
        return;
    }

    // Obtener el rol del usuario actual
    const currentUserAttendance = JSON.parse(localStorage.getItem('progressUser'));
    const userRole = currentUserAttendance ? currentUserAttendance.role : 'employee';

    // Agrupar registros por día para mostrar resumen de horas
    const dailyRecords = {};
    
    records.forEach(record => {
        const date = new Date(record.timestamp);
        const dateKey = date.toDateString();
        
        if (!dailyRecords[dateKey]) {
            dailyRecords[dateKey] = {
                date: dateKey,
                records: [],
                totalMinutes: 0,
                regularHours: 0,
                overtimeHours: 0
            };
        }
        
        dailyRecords[dateKey].records.push(record);
    });

    // Calcular horas por día
    Object.values(dailyRecords).forEach(day => {
        const sortedRecords = day.records.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        let entryTime = null;
        let totalMinutes = 0;
        
        sortedRecords.forEach(record => {
            const recordTime = new Date(record.timestamp);
            
            if (record.type === 'entry') {
                entryTime = recordTime;
            } else if (record.type === 'exit' && entryTime) {
                const diffMinutes = Math.round((recordTime - entryTime) / (1000 * 60));
                totalMinutes += diffMinutes;
                entryTime = null;
            }
        });

        // Convertir minutos a horas
        day.totalMinutes = totalMinutes;
        day.regularHours = Math.min(totalMinutes / 60, 8); // 8 horas regulares
        day.overtimeHours = Math.max(0, (totalMinutes / 60) - 8); // Horas extras
    });

    // Generar HTML
    let html = '';
    Object.values(dailyRecords).forEach(day => {
        const date = new Date(day.date);
        const dateStr = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        html += `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">${dateStr}</h6>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            ${day.regularHours.toFixed(1)}h regulares
                            ${day.overtimeHours > 0 ? ` + ${day.overtimeHours.toFixed(1)}h extras` : ''}
                        </small>
                        ${userRole === 'admin' ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteDayRecords('${day.date}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="card-body">
                    ${day.records.map(record => {
                        const time = new Date(record.timestamp).toLocaleTimeString('es-ES');
                        const typeClass = record.type === 'entry' ? 'success' : 'danger';
                        const typeIcon = record.type === 'entry' ? 'fa-sign-in-alt' : 'fa-sign-out-alt';
                        const typeText = record.type === 'entry' ? 'Entrada' : 'Salida';
                        
                        return `
                            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                <div>
                                    <span class="badge bg-${typeClass} me-2">
                                        <i class="fas ${typeIcon}"></i> ${typeText}
                                    </span>
                                    <small class="text-muted">${time}</small>
                                </div>
                                <div>
                                    ${record.photo ? `
                                        <img src="${record.photo}" alt="Foto" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px; cursor: pointer;" onclick="showRecordDetails('${encodeURIComponent(JSON.stringify(record))}')">
                                    ` : `
                                        <span class="text-muted">No hay foto disponible</span>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function loadMyAttendance() {
    try {
        const response = await fetch(`${API_BASE}/attendance`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });
        
        const records = await response.json();
        displayAttendanceRecords(records);
        
        // Verificar si hay sesión abierta y configurar recordatorios
        checkOpenSessionAndSetReminders(records);
    } catch (error) {
        console.error('Error cargando asistencia:', error);
        document.getElementById('attendanceRecords').innerHTML = 
            '<p class="text-danger">Error al cargar registros</p>';
    }
}

function checkOpenSessionAndSetReminders(records) {
    if (records.length === 0) return;
    
    // Ordenar registros por timestamp
    const sortedRecords = records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const lastRecord = sortedRecords[0];
    
    // Verificar si el último registro es una entrada sin salida
    if (lastRecord.type === 'entry') {
        const entryTime = new Date(lastRecord.timestamp);
        const now = new Date();
        const hoursSinceEntry = (now - entryTime) / (1000 * 60 * 60);
        
        // Si han pasado más de 9 horas, mostrar recordatorio
        if (hoursSinceEntry > 9) {
            showSessionReminder();
        }
        
        // Configurar recordatorios automáticos
        setupAutomaticReminders(entryTime);
    }
}

function showSessionReminder() {
    // Verificar si ya se mostró el recordatorio recientemente
    const lastReminder = localStorage.getItem('lastSessionReminder');
    const now = Date.now();
    
    if (lastReminder && (now - parseInt(lastReminder)) < 60 * 60 * 1000) {
        return; // No mostrar si pasó menos de 60 minutos
    }
    
    // Guardar timestamp del último recordatorio
    localStorage.setItem('lastSessionReminder', now.toString());
    
    // Mostrar notificación personalizada
    showCustomAlert(
        '⏰ SESIÓN ABIERTA DETECTADA', 
        'Parece que tienes una sesión de trabajo abierta.<br><br>Por favor registra tu salida para evitar errores en el cálculo de horas extras.', 
        'warning'
    );
    
    // Enviar notificación del navegador si está permitido
    sendBrowserNotification('Sesión Abierta', 'Registra tu salida para evitar errores en horas extras');
}

function sendBrowserNotification(title, body) {
    // Verificar si el navegador soporta notificaciones
    if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones");
        return;
    }
    
    // Solicitar permiso si no se ha concedido
    if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                createNotification(title, body);
            }
        });
    } else if (Notification.permission === "granted") {
        createNotification(title, body);
    }
}

function createNotification(title, body) {
    // Reproducir sonido de notificación
    playNotificationSound();
    
    const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'session-reminder',
        requireInteraction: true
    });
    
    setTimeout(() => {
        notification.close();
    }, 10000);
}

function playNotificationSound() {
    // Crear un sonido simple usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frecuencia en Hz
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1; // Volumen bajo
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1); // Sonido corto de 100ms
}

async function recordAttendance(type) {
    console.log('🚀 Iniciando registro de asistencia:', type);
    console.log('📍 Ubicación actual:', currentLocation);
    console.log('📷 Estado de cámara:', cameraStream ? 'activa' : 'inactiva');
    
    if (!currentLocation) {
        console.error('❌ Error: No hay ubicación');
        showCustomAlert('📍 Ubicación Requerida', 'Debe obtener la ubicación antes de registrar asistencia', 'warning');
        return;
    }
    
    if (!cameraStream) {
        console.error('❌ Error: No hay cámara activa');
        showCustomAlert('📷 Cámara Requerida', 'Debe activar la cámara antes de registrar asistencia', 'warning');
        return;
    }
    
    try {
        console.log('📸 Capturando foto...');
        const photoBlob = await capturePhoto();
        console.log('📸 Foto capturada, tamaño:', photoBlob.size, 'bytes');
        
        const formData = new FormData();
        formData.append('type', type);
        formData.append('latitude', currentLocation.latitude);
        formData.append('longitude', currentLocation.longitude);
        formData.append('photo', photoBlob, 'attendance.jpg');
        
        console.log('🌐 Enviando petición a:', `${API_BASE}/attendance`);
        
        const token = localStorage.getItem('progressToken');
        console.log('🔑 Token:', token ? 'existe' : 'no existe');
        
        const response = await fetch(`${API_BASE}/attendance`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('📡 Respuesta del servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        if (data.error) {
            console.error('❌ Error del servidor:', data.error);
            showCustomAlert('❌ Error', data.error, 'danger');
        } else {
            const action = type === 'entry' ? 'entrada' : 'salida';
            console.log('✅', action, 'registrada correctamente');
            
            showCustomAlert(
                '✅ Registro Exitoso', 
                `${action.charAt(0).toUpperCase() + action.slice(1)} registrada correctamente`, 
                'success'
            );
            
            // Mostrar alerta específico para entradas
            if (type === 'entry') {
                setTimeout(() => {
                    showCustomAlert(
                        '⏰ RECORDATORIO', 
                        'No olvides registrar tu salida al finalizar tu jornada.<br><br>Esto evitará errores en el cálculo de horas extras y mantendrá tus registros correctos.', 
                        'info'
                    );
                }, 1000);
            }
            
            loadMyAttendance();
        }
    } catch (error) {
        console.error('💥 Error completo:', error);
        
        let errorMessage = 'Error al registrar asistencia. Intente nuevamente.';
        
        if (error.message.includes('HTTP 401')) {
            errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
            setTimeout(() => logout(), 2000);
        } else if (error.message.includes('HTTP 403')) {
            errorMessage = 'No tiene permisos para registrar asistencia.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Error de red. Intente nuevamente.';
        }
        
        showCustomAlert('❌ Error de Conexión', errorMessage, 'danger');
    }
}

async function loadAllRecordsDirectly() {
    console.log('🔄 Cargando todos los registros...');
    const token = localStorage.getItem('progressToken');
    
    if (!token) {
        console.error('❌ No hay token en localStorage');
        showCustomAlert('❌ Error', 'No hay sesión activa. Por favor inicia sesión.', 'danger');
        return;
    }
    
    console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
    
    try {
        const response = await fetch(`${API_BASE}/attendance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Respuesta status:', response.status);
        console.log('📡 Respuesta headers:', [...response.headers.entries()]);
        
        if (response.ok) {
            const records = await response.json();
            console.log('📋 Registros recibidos:', records.length);
            displayAttendanceRecords(records);
        } else {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            showCustomAlert('❌ Error', `Error ${response.status}: ${errorText}`, 'danger');
        }
    } catch (error) {
        console.error('❌ Error cargando registros:', error);
        showCustomAlert('❌ Error', 'No se pudieron cargar los registros', 'danger');
    }
}

function displayAllRecords(records) {
    const container = document.getElementById('attendanceRecordsBody');
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
            photoUrl = `http://localhost:3000/uploads/${record.photo_path}`;
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

function displayEmployeeSummary(records) {
    const summaryContainer = document.getElementById('employeeSummary');
    if (!summaryContainer) {
        console.log('❌ Contenedor employeeSummary no encontrado');
        return;
    }
    
    console.log('📊 Generando resumen de ingresos por empleado...');
    console.log('📋 Registros recibidos:', records.length);
    
    if (records.length === 0) {
        summaryContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No hay registros para mostrar en el resumen.</div></div>';
        return;
    }
    
    // Agrupar registros por empleado
    const employeeStats = {};
    
    records.forEach(record => {
        const employeeName = record.employee_name || 'Empleado Desconocido';
        
        if (!employeeStats[employeeName]) {
            employeeStats[employeeName] = {
                name: employeeName,
                totalEntries: 0,
                totalExits: 0,
                totalHours: 0,
                dailyOvertime: {},
                totalOvertime: 0
            };
        }
        
        const stats = employeeStats[employeeName];
        
        if (record.type === 'entry') {
            stats.totalEntries++;
        } else if (record.type === 'exit') {
            stats.totalExits++;
        }
        
        // Calcular horas trabajadas (simplificado)
        const dateKey = new Date(record.timestamp).toLocaleDateString('es-CO');
        if (!stats.dailyOvertime[dateKey]) {
            stats.dailyOvertime[dateKey] = 0;
        }
        
        // Asumir 8 horas por día como base, calcular extras
        const dailyHours = 8; // Base
        const overtime = Math.max(0, dailyHours - 8);
        
        if (overtime > 0) {
            stats.dailyOvertime[dateKey] += overtime;
            stats.totalOvertime += overtime;
        }
        
        stats.totalHours += dailyHours;
    });
    
    console.log('📊 Estadísticas procesadas:', Object.keys(employeeStats).length, 'empleados');
    
    // Generar HTML para el resumen
    let summaryHtml = '';
    
    Object.values(employeeStats).forEach(stats => {
        const totalRecords = stats.totalEntries + stats.totalExits;
        const percentage = totalRecords > 0 ? ((stats.totalEntries / totalRecords) * 100).toFixed(1) : 0;
        
        summaryHtml += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3);">
                    <div class="card-body text-center">
                        <h6 class="card-title text-white mb-3">
                            <i class="fas fa-user me-2"></i>${stats.name}
                        </h6>
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <div class="text-success">
                                    <i class="fas fa-sign-in-alt fa-lg mb-1"></i>
                                    <h6 class="mb-0">${stats.totalEntries}</h6>
                                    <small>Entradas</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="text-danger">
                                    <i class="fas fa-sign-out-alt fa-lg mb-1"></i>
                                    <h6 class="mb-0">${stats.totalExits}</h6>
                                    <small>Salidas</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="text-info">
                                    <i class="fas fa-clock fa-lg mb-1"></i>
                                    <h6 class="mb-0">${stats.totalHours}</h6>
                                    <small>Horas</small>
                                </div>
                            </div>
                        </div>
                        <div class="mb-2">
                            <small class="text-muted">Total Registros: ${totalRecords}</small>
                        </div>
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar bg-info" style="width: ${percentage}%"></div>
                        </div>
                        <div class="text-center">
                            <small class="text-warning">
                                <i class="fas fa-exclamation-triangle me-1"></i>
                                Horas Extras: ${stats.totalOvertime.toFixed(1)}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    summaryContainer.innerHTML = summaryHtml;
    console.log('✅ Resumen de ingresos actualizado correctamente');
}

function showEmployees() {
    const employeesSection = document.getElementById('employeesSection');
    const attendanceSection = document.getElementById('attendanceSection');
    
    if (employeesSection) employeesSection.classList.remove('hidden');
    if (attendanceSection) attendanceSection.classList.add('hidden');
    
    loadEmployees();
}

// Funciones CRUD para empleados
async function addEmployee() {
    const name = document.getElementById('newEmployeeName')?.value;
    const email = document.getElementById('newEmployeeEmail')?.value;
    const role = document.getElementById('newEmployeeRole')?.value;
    const password = document.getElementById('newEmployeePassword')?.value;
    const position = document.getElementById('newEmployeePosition')?.value;
    
    if (!name || !email || !role || !password || !position) {
        showCustomAlert('❌ Error', 'Todos los campos son obligatorios', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: JSON.stringify({ name, email, role, password, position })
        });
        
        if (response.ok) {
            showCustomAlert('✅ Éxito', 'Empleado agregado correctamente', 'success');
            closeModal('addEmployeeModal');
            loadEmployees();
        } else {
            const error = await response.text();
            showCustomAlert('❌ Error', error, 'danger');
        }
    } catch (error) {
        console.error('Error agregando empleado:', error);
        showCustomAlert('❌ Error', 'No se pudo agregar el empleado', 'danger');
    }
}

async function editEmployee(id) {
    try {
        const response = await fetch(`${API_BASE}/admin/employees/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });
        
        if (response.ok) {
            const employee = await response.json();
            document.getElementById('editEmployeeId').value = employee.id;
            document.getElementById('editEmployeeName').value = employee.name;
            document.getElementById('editEmployeeEmail').value = employee.email;
            document.getElementById('editEmployeeRole').value = employee.role;
            openModal('editEmployeeModal');
        }
    } catch (error) {
        console.error('Error cargando empleado:', error);
        showCustomAlert('❌ Error', 'No se pudo cargar el empleado', 'danger');
    }
}

async function updateEmployee() {
    const id = document.getElementById('editEmployeeId')?.value;
    const name = document.getElementById('editEmployeeName')?.value;
    const email = document.getElementById('editEmployeeEmail')?.value;
    const role = document.getElementById('editEmployeeRole')?.value;
    
    if (!id || !name || !email || !role) {
        showCustomAlert('❌ Error', 'Todos los campos son obligatorios', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/employees/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: JSON.stringify({ name, email, role })
        });
        
        if (response.ok) {
            showCustomAlert('✅ Éxito', 'Empleado actualizado correctamente', 'success');
            closeModal('editEmployeeModal');
            loadEmployees();
        } else {
            const error = await response.text();
            showCustomAlert('❌ Error', error, 'danger');
        }
    } catch (error) {
        console.error('Error actualizando empleado:', error);
        showCustomAlert('❌ Error', 'No se pudo actualizar el empleado', 'danger');
    }
}

async function deleteEmployee(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/employees/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });
        
        if (response.ok) {
            showCustomAlert('✅ Éxito', 'Empleado eliminado correctamente', 'success');
            loadEmployees();
        } else {
            const error = await response.text();
            showCustomAlert('❌ Error', error, 'danger');
        }
    } catch (error) {
        console.error('Error eliminando empleado:', error);
        showCustomAlert('❌ Error', 'No se pudo eliminar el empleado', 'danger');
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

function showAddEmployee() {
    openModal('addEmployeeModal');
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('progressToken');
    if (token) {
        const user = JSON.parse(localStorage.getItem('progressUser'));
        loginSuccess(user, token);
    }
});

// Función para mostrar detalles completos de un registro
function showRecordDetails(record) {
    console.log('📋 Mostrando detalles del registro:', record);
    
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('recordDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Crear HTML del modal
    const modalHtml = `
        <div class="modal fade" id="recordDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content" style="background: rgba(30, 41, 59, 0.98); border: 2px solid var(--progress-teal);">
                    <div class="modal-header" style="background: linear-gradient(45deg, var(--progress-teal), var(--progress-blue)); border: none;">
                        <h5 class="modal-title text-white">
                            <i class="fas fa-info-circle me-2"></i>
                            Detalles del Registro de Asistencia
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <!-- Información básica -->
                            <div class="col-md-6">
                                <h6 class="text-white mb-3">
                                    <i class="fas fa-user me-2"></i>Información del Empleado
                                </h6>
                                <div class="mb-3">
                                    <label class="text-white-50 small">Nombre:</label>
                                    <div class="text-white fw-bold">${record.employee_name || 'N/A'}</div>
                                </div>
                                <div class="mb-3">
                                    <label class="text-white-50 small">Tipo:</label>
                                    <div>
                                        <span class="badge bg-${record.type === 'entry' ? 'success' : 'danger'}">
                                            ${record.type === 'entry' ? '🟢 Entrada' : '🔴 Salida'}
                                        </span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="text-white-50 small">Fecha y Hora:</label>
                                    <div class="text-white">
                                        ${new Date(record.timestamp).toLocaleDateString('es-CO')}<br>
                                        <small class="text-white-50">
                                            ${new Date(record.timestamp).toLocaleTimeString('es-CO')}
                                        </small>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Foto -->
                            <div class="col-md-6">
                                <h6 class="text-white mb-3">
                                    <i class="fas fa-camera me-2"></i>Foto del Registro
                                </h6>
                                ${record.photo_path ? `
                                    <div class="text-center">
                                        <img src="http://localhost:3000/uploads/${record.photo_path}" 
                                             alt="Foto del registro" 
                                             class="img-fluid rounded"
                                             style="max-height: 200px; border: 2px solid var(--progress-teal);">
                                        <div class="mt-2">
                                            <a href="http://localhost:3000/uploads/${record.photo_path}" 
                                               target="_blank" 
                                               class="btn btn-sm btn-outline-light">
                                                <i class="fas fa-expand me-1"></i> Ver en tamaño completo
                                            </a>
                                        </div>
                                    </div>
                                ` : `
                                    <div class="text-center text-white-50">
                                        <i class="fas fa-camera fa-3x mb-2"></i>
                                        <p>No hay foto disponible</p>
                                    </div>
                                `}
                            </div>
                        </div>
                        
                        <!-- Mapa -->
                        ${record.latitude && record.longitude ? `
                            <div class="row mt-4">
                                <div class="col-12">
                                    <h6 class="text-white mb-3">
                                        <i class="fas fa-map-marker-alt me-2"></i>Ubicación
                                    </h6>
                                    <div class="row">
                                        <div class="col-md-8">
                                            <div class="map-container rounded" style="border: 2px solid var(--progress-teal); overflow: hidden;">
                                                <div id="record-map-${record.id || Date.now()}" style="width: 100%; height: 250px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                                                    <div class="text-center">
                                                        <i class="fas fa-map-marker-alt fa-3x text-muted mb-2"></i>
                                                        <p class="text-muted">Cargando mapa...</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="text-white">
                                                <label class="text-white-50 small">Coordenadas:</label>
                                                <div class="fw-bold">
                                                    Lat: ${record.latitude.toFixed(6)}<br>
                                                    Lng: ${record.longitude.toFixed(6)}
                                                </div>
                                                <div class="mt-3">
                                                    <a href="https://www.google.com/maps?q=${record.latitude},${record.longitude}" 
                                                       target="_blank" 
                                                       class="btn btn-sm btn-outline-info w-100">
                                                        <i class="fas fa-external-link-alt me-1"></i> Ver en Google Maps
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Información adicional -->
                        <div class="row mt-4">
                            <div class="col-12">
                                <h6 class="text-white mb-3">
                                    <i class="fas fa-info-circle me-2"></i>Información Adicional
                                </h6>
                                <div class="row text-white">
                                    <div class="col-md-4">
                                        <small class="text-white-50">ID del Registro:</small>
                                        <div class="fw-bold">${record.id || 'N/A'}</div>
                                    </div>
                                    <div class="col-md-4">
                                        <small class="text-white-50">ID del Empleado:</small>
                                        <div class="fw-bold">${record.employee_id || 'N/A'}</div>
                                    </div>
                                    <div class="col-md-4">
                                        <small class="text-white-50">Dispositivo:</small>
                                        <div class="fw-bold">${record.device_info || 'Web'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="background: rgba(0, 0, 0, 0.3); border-top: 1px solid var(--progress-teal);">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i> Cerrar
                        </button>
                        ${record.latitude && record.longitude ? `
                            <a href="https://www.google.com/maps?q=${record.latitude},${record.longitude}" 
                               target="_blank" 
                               class="btn btn-info">
                                <i class="fas fa-map me-1"></i> Abrir en Google Maps
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar el modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('recordDetailsModal'));
    modal.show();
    
    // Cargar el mapa si hay coordenadas
    if (record.latitude && record.longitude) {
        setTimeout(() => {
            loadOpenStreetMap(record.latitude, record.longitude, record.id || Date.now());
        }, 500);
    }
    
    // Limpiar el modal cuando se cierre
    document.getElementById('recordDetailsModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Función para activar/desactivar cámara
async function toggleCamera() {
    const video = document.getElementById('video');
    const placeholder = document.getElementById('cameraPlaceholder');
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        video.style.display = 'none';
        placeholder.style.display = 'block';
        placeholder.innerHTML = `
            <i class="fas fa-camera fa-3x text-muted"></i>
            <p class="text-muted mt-2">Cámara no activada</p>
        `;
        
        // Ocultar botón de cambiar cámara
        document.getElementById('switchCameraBtn').style.display = 'none';
    } else {
        try {
            // Solicitar permisos de cámara explícitamente
            const permissions = await navigator.permissions.query({ name: 'camera' });
            
            if (permissions.state === 'denied') {
                alert('Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
                return;
            }
            
            // Intentar obtener acceso a la cámara con diferentes configuraciones
            let stream = null;
            const constraints = [
                { video: { facingMode: 'user' } },
                { video: { facingMode: 'environment' } },
                { video: true }
            ];
            
            for (const constraint of constraints) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraint);
                    break;
                } catch (e) {
                    console.log('Intentando siguiente configuración de cámara...');
                }
            }
            
            if (!stream) {
                throw new Error('No se pudo acceder a ninguna cámara');
            }
            
            cameraStream = stream;
            video.srcObject = cameraStream;
            video.style.display = 'block';
            placeholder.style.display = 'none';
            video.play();
            
            // Mostrar botón de cambiar cámara si hay múltiples cámaras
            checkAndShowSwitchCameraButton();
            
        } catch (error) {
            console.error('Error de cámara:', error);
            let mensaje = 'No se pudo acceder a la cámara. ';
            
            if (error.name === 'NotAllowedError') {
                mensaje += 'Por favor, permite el acceso a la cámara en los ajustes del navegador.';
            } else if (error.name === 'NotFoundError') {
                mensaje += 'No se encontró ninguna cámara en el dispositivo.';
            } else if (error.name === 'NotReadableError') {
                mensaje += 'La cámara está siendo usada por otra aplicación.';
            } else {
                mensaje += 'Asegúrate de usar HTTPS o localhost.';
            }
            
            alert(mensaje);
        }
    }
}

// Función para obtener ubicación
function getLocation() {
    const locationText = document.getElementById('locationText');
    
    if (!navigator.geolocation) {
        locationText.textContent = 'Geolocalización no soportada en este navegador';
        return;
    }
    
    locationText.innerHTML = '<div class="spinner spinner-sm"></div> Obteniendo ubicación...';
    
    // Verificar permisos primero
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
            locationText.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Permiso de ubicación denegado</strong><br>
                    <small>Por favor, permite el acceso a la ubicación en los ajustes del navegador.</small>
                </div>
            `;
            return;
        }
        
        // Solicitar ubicación con opciones optimizadas para móviles
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                
                const mapsUrl = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
                
                locationText.innerHTML = `
                    <div>
                        <strong>✅ Ubicación obtenida</strong><br>
                        <small class="text-muted">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            Precisión: ±${currentLocation.accuracy.toFixed(0)}m
                        </small><br>
                        <small class="text-muted">
                            Lat: ${currentLocation.latitude.toFixed(6)}, Lng: ${currentLocation.longitude.toFixed(6)}
                        </small><br>
                        <a href="${mapsUrl}" target="_blank" class="btn btn-sm btn-info mt-1">
                            <i class="fas fa-map me-1"></i>Ver en Google Maps
                        </a>
                    </div>
                `;
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                let mensaje = 'Error obteniendo ubicación: ';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        mensaje += 'Permiso denegado por el usuario.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        mensaje += 'Información de ubicación no disponible.';
                        break;
                    case error.TIMEOUT:
                        mensaje += 'Tiempo de espera agotado.';
                        break;
                    default:
                        mensaje += 'Error desconocido.';
                        break;
                }
                
                locationText.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${mensaje}
                    </div>
                `;
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }).catch((error) => {
        console.error('Error verificando permisos de ubicación:', error);
        locationText.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error verificando permisos de ubicación
            </div>
        `;
    });
}

// Función para verificar y mostrar botón de cambiar cámara
async function checkAndShowSwitchCameraButton() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length > 1) {
            document.getElementById('switchCameraBtn').style.display = 'inline-block';
        }
    } catch (error) {
        console.error('Error verificando cámaras:', error);
    }
}

// Función para cambiar de cámara
async function switchCamera() {
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentCamera }
        });
        
        cameraStream = stream;
        const video = document.getElementById('video');
        video.srcObject = cameraStream;
        video.play();
    } catch (error) {
        console.error('Error cambiando cámara:', error);
        alert('No se pudo cambiar de cámara');
    }
}
