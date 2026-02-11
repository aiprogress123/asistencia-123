let currentUser = null;
let currentLocation = null;
let cameraStream = null;
let photoData = null;

// Configuración de zona horaria para Colombia
const TIMEZONE = 'America/Bogota';

// Función para formatear fecha y hora en zona horaria de Colombia
function formatDateTimeColombia(date) {
    return new Date(date).toLocaleString('es-CO', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// Función para formatear solo fecha en zona horaria de Colombia
function formatDateColombia(date) {
    return new Date(date).toLocaleDateString('es-CO', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Función para formatear solo hora en zona horaria de Colombia
function formatTimeColombia(date) {
    return new Date(date).toLocaleTimeString('es-CO', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

const API_BASE = window.location.origin + '/api';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('progressToken');
    if (token) {
        const user = JSON.parse(localStorage.getItem('progressUser'));
        loginSuccess(user, token);
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loginSuccess(data.user, data.token);
        } else {
            alert(data.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        alert('Error de conexión. Intente nuevamente.');
    }
});

function loginSuccess(user, token) {
    currentUser = user;
    localStorage.setItem('progressToken', token);
    localStorage.setItem('progressUser', JSON.stringify(user));
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    document.getElementById('userInfo').innerHTML = `
        <div class="d-inline-block">
            <span class="text-white fw-bold me-2">PROGRESS NET</span>
            <span class="text-muted">|</span>
            <span class="text-black bg-white px-2 py-1 rounded">${user.name}</span>
            <span class="text-muted">(${user.role === 'admin' ? 'Administrador' : 'Empleado'})</span>
        </div>
    `;
    
    if (user.role === 'admin') {
        document.getElementById('employeeView').classList.add('hidden');
        document.getElementById('adminView').classList.remove('hidden');
        loadEmployees();
    } else {
        document.getElementById('employeeView').classList.remove('hidden');
        document.getElementById('adminView').classList.add('hidden');
        loadMyAttendance();
        getLocation();
    }
}

function logout() {
    localStorage.removeItem('progressToken');
    localStorage.removeItem('progressUser');
    currentUser = null;
    
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

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
            
            // Mostrar instrucciones específicas para móviles
            if (window.innerWidth <= 768) {
                placeholder.innerHTML = `
                    <i class="fas fa-camera fa-3x text-muted"></i>
                    <p class="text-muted mt-2">Cámara no disponible</p>
                    <div class="alert alert-info mt-3">
                        <strong>Para activar la cámara:</strong><br>
                        1. Toca el ícono de 🔒 o ⚠️ en la barra de dirección<br>
                        2. Permite acceso a "Cámara"<br>
                        3. Recarga la página
                    </div>
                `;
            }
        }
    }
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    photoData = canvas.toDataURL('image/jpeg');
    return photoData;
}

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
                console.error('Error de geolocalización:', error);
                let message = '';
                let instructions = '';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Permiso de ubicación denegado';
                        instructions = `
                            <strong>Para permitir ubicación:</strong><br>
                            1. Toca el ícono de 🔒 o ⚠️ en la barra de dirección<br>
                            2. Permite acceso a "Ubicación"<br>
                            3. Recarga la página
                        `;
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'GPS no disponible';
                        instructions = 'Verifica que el GPS esté activado en tu dispositivo.';
                        break;
                    case error.TIMEOUT:
                        message = 'Tiempo de espera agotado';
                        instructions = 'Intenta nuevamente o verifica tu conexión a internet.';
                        break;
                    default:
                        message = 'Error desconocido';
                        instructions = 'Intenta recargar la página.';
                }
                
                locationText.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>${message}</strong><br>
                        <small>${instructions}</small>
                    </div>
                `;
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }).catch(() => {
        // Si no se puede verificar permisos, intentar directamente
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
                locationText.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Error al obtener ubicación</strong><br>
                        <small>Verifica que el GPS esté activado y hayas dado permisos.</small>
                    </div>
                `;
            }
        );
    });
}

async function recordAttendance(type) {
    if (!currentLocation) {
        alert('Debe obtener la ubicación antes de registrar asistencia');
        return;
    }
    
    if (!cameraStream) {
        alert('Debe activar la cámara antes de registrar asistencia');
        return;
    }
    
    const photoBlob = await capturePhoto();
    const formData = new FormData();
    formData.append('type', type);
    formData.append('latitude', currentLocation.latitude);
    formData.append('longitude', currentLocation.longitude);
    
    fetch(photoData)
        .then(res => res.blob())
        .then(blob => {
            formData.append('photo', blob, 'attendance.jpg');
            
            return fetch(`${API_BASE}/attendance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
                },
                body: formData
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                const action = type === 'entry' ? 'entrada' : 'salida';
                alert(`${action.charAt(0).toUpperCase() + action.slice(1)} registrada correctamente`);
                loadMyAttendance();
            }
        })
        .catch(error => {
            alert('Error al registrar asistencia. Intente nuevamente.');
        });
}

async function deleteAttendanceRecord(recordId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/attendance/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });

        if (response.ok) {
            alert('Registro eliminado exitosamente');
            loadMyAttendance(); // Recargar registros del empleado
        } else {
            alert('Error al eliminar el registro');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el registro');
    }
}

async function deleteAllRecords() {
    if (!confirm('¿Estás seguro de que quieres eliminar TODOS tus registros de asistencia? Esta acción eliminará todas tus entradas y salidas registradas hasta ahora y no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/attendance/all`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });

        if (response.ok) {
            alert('Todos tus registros han sido eliminados exitosamente');
            loadMyAttendance(); // Recargar vista
        } else {
            alert('Error al eliminar los registros');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar los registros');
    }
}

function displayAttendanceRecords(records) {
    const container = document.getElementById('attendanceRecords');
    
    if (records.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay registros de asistencia</p>';
        return;
    }

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
        
        // Si hay una entrada sin salida (trabajando actualmente)
        if (entryTime) {
            const now = new Date();
            const diffMinutes = Math.round((now - entryTime) / (1000 * 60));
            totalMinutes += diffMinutes;
        }
        
        day.totalMinutes = totalMinutes;
        day.regularHours = Math.min(9, Math.floor(totalMinutes / 60));
        day.overtimeHours = Math.max(0, totalMinutes / 60 - 9);
        day.displayTime = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
        day.colombiaTime = formatDateTimeColombia(new Date(day.records[0].timestamp));
    });

    // Mostrar resumen de horas trabajadas
    const totalRegularHours = Object.values(dailyRecords).reduce((sum, day) => sum + day.regularHours, 0);
    const totalOvertimeHours = Object.values(dailyRecords).reduce((sum, day) => sum + day.overtimeHours, 0);
    const daysWorked = Object.keys(dailyRecords).length;

    const summaryHtml = `
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title">Días Trabajados</h6>
                        <h4 class="text-success">${daysWorked}</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title">Horas Extras Totales</h6>
                        <h4 class="text-warning">${totalOvertimeHours.toFixed(1)}h</h4>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Mostrar registros individuales
    let recordsHtml = '<h5 class="text-white mb-3">Mis Registros</h5>';
    
    Object.values(dailyRecords).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    ).forEach(day => {
        const dateObj = new Date(day.date);
        const dateStr = formatDateColombia(dateObj);
        
        recordsHtml += `
            <div class="attendance-record">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">
                            <i class="fas fa-calendar-day me-2"></i>
                            ${dateStr}
                        </h6>
                        <div class="mb-2">
                            ${day.overtimeHours > 0 ? `
                                <span class="badge bg-warning">
                                    <i class="fas fa-hourglass-half me-1"></i>
                                    Extras: ${day.overtimeHours.toFixed(1)}h
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="mt-3">
                    ${day.records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map(record => {
                        const date = new Date(record.timestamp);
                        const typeIcon = record.type === 'entry' ? 'sign-in-alt' : 'sign-out-alt';
                        const typeText = record.type === 'entry' ? 'Entrada' : 'Salida';
                        const typeBadge = record.type === 'entry' ? 'success' : 'danger';
                        
                        return `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <span class="badge bg-${typeBadge}">
                                        <i class="fas fa-${typeIcon} me-1"></i>${typeText}
                                    </span>
                                    <small class="text-black bg-white px-2 py-1 rounded ms-2">
                                        ${formatTimeColombia(date)}
                                    </small>
                                </div>
                                <div>
                                    ${record.latitude ? `
                                        <small class="text-muted">
                                            <i class="fas fa-map-marker-alt me-1"></i>
                                            ${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}
                                        </small>
                                        <a href="https://www.google.com/maps?q=${record.latitude},${record.longitude}" 
                                           target="_blank" 
                                           class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="fas fa-map me-1"></i>Maps
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                            ${record.photo_path ? `
                                <div class="mt-2">
                                    <img src="/uploads/${record.photo_path}" 
                                         class="photo-thumbnail" 
                                         onclick="window.open('/uploads/${record.photo_path}', '_blank')"
                                         alt="Foto de ${typeText}">
                                </div>
                            ` : ''}
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = summaryHtml + recordsHtml;
}

async function loadEmployees() {
    try {
        const response = await fetch(`${API_BASE}/admin/employees`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });
        
        const employees = await response.json();
        displayEmployees(employees);
    } catch (error) {
        document.getElementById('employeesTableBody').innerHTML = 
            '<tr><td colspan="6" class="text-center text-danger">Error al cargar empleados</td></tr>';
    }
}

function displayEmployees(employees) {
    const tbody = document.getElementById('employeesTableBody');
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay empleados registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td><span class="text-black bg-white px-2 py-1 rounded">${emp.id}</span></td>
            <td><span class="text-black bg-white px-2 py-1 rounded">${emp.name}</span></td>
            <td><span class="text-black bg-white px-2 py-1 rounded">${emp.email}</span></td>
            <td><span class="text-black bg-white px-2 py-1 rounded">${emp.position || 'N/A'}</span></td>
            <td>
                <span class="badge bg-${emp.role === 'admin' ? 'danger' : 'primary'}">
                    ${emp.role === 'admin' ? 'Administrador' : 'Empleado'}
                </span>
            </td>
            <td><span class="text-black bg-white px-2 py-1 rounded">${formatDateColombia(new Date(emp.created_at))}</span></td>
        </tr>
    `).join('');
}

async function loadAllAttendance() {
    try {
        const response = await fetch(`${API_BASE}/admin/attendance`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });
        
        const records = await response.json();
        allAttendanceRecords = records; // Guardar para usar en detalles
        displayAllAttendance(records);
    } catch (error) {
        document.getElementById('attendanceTableBody').innerHTML = 
            '<tr><td colspan="7" class="text-center text-danger">Error al cargar registros</td></tr>';
    }
}

function displayAllAttendance(records) {
    const tbody = document.getElementById('attendanceTableBody');
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay registros de asistencia</td></tr>';
        return;
    }

    // Agrupar registros por empleado y día
    const employeeDays = {};
    
    records.forEach(record => {
        const date = new Date(record.timestamp);
        const dateKey = date.toDateString();
        const employeeKey = `${record.employee_name}-${dateKey}`;
        
        if (!employeeDays[employeeKey]) {
            employeeDays[employeeKey] = {
                employee_name: record.employee_name,
                email: record.email,
                position: record.position,
                date: dateKey,
                records: [],
                totalMinutes: 0,
                regularHours: 0,
                overtimeHours: 0
            };
        }
        
        employeeDays[employeeKey].records.push(record);
    });

    // Calcular horas por día
    Object.values(employeeDays).forEach(day => {
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
        
        // Si hay una entrada sin salida (trabajando actualmente)
        if (entryTime) {
            const now = new Date();
            const diffMinutes = Math.round((now - entryTime) / (1000 * 60));
            totalMinutes += diffMinutes;
        }
        
        day.totalMinutes = totalMinutes;
        day.regularHours = Math.min(9, Math.floor(totalMinutes / 60));
        day.overtimeHours = Math.max(0, totalMinutes / 60 - 9);
        day.displayTime = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
        day.colombiaTime = formatDateTimeColombia(new Date(day.records[0].timestamp));
    });

    // Agrupar por empleado para estadísticas
    const employeeStats = {};
    Object.values(employeeDays).forEach(day => {
        if (!employeeStats[day.employee_name]) {
            employeeStats[day.employee_name] = {
                employee_name: day.employee_name,
                email: day.email,
                position: day.position,
                days_worked: 0,
                total_overtime: 0
            };
        }
        employeeStats[day.employee_name].days_worked++;
        employeeStats[day.employee_name].total_overtime += day.overtime_hours;
    });

    // Mostrar resumen por empleado
    let summaryHtml = '<h5 class="text-white mb-3">Resumen por Empleado</h5>';
    summaryHtml += '<div class="row mb-4">';

    Object.values(employeeStats).forEach(emp => {
        summaryHtml += `
            <div class="col-md-4 mb-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title">
                            <span class="text-black bg-white px-2 py-1 rounded">${emp.employee_name}</span><br>
                            <span class="text-black bg-white px-2 py-1 rounded">${emp.position || 'N/A'}</span>
                        </h6>
                        <div class="mt-2">
                            <div class="mb-2">
                                <small class="text-muted">Días Trabajados</small>
                                <h5 class="text-success mb-0">${emp.days_worked}</h5>
                            </div>
                            <div>
                                <small class="text-muted">Horas Extras</small>
                                <h5 class="text-warning mb-0">${emp.total_overtime.toFixed(1)}h</h5>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    summaryHtml += '</div>';

    // Mostrar tabla de resumen
    summaryHtml += `
        <h4 class="text-white mb-3">Resumen de Horas Extras</h4>
        <div class="table-responsive mb-4">
            <table class="table admin-table">
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Días Trabajados</th>
                        <th>Horas Extras</th>
                    </tr>
                </thead>
                <tbody>
    `;

    Object.values(employeeStats).forEach(emp => {
        summaryHtml += `
            <tr>
                <td>
                    <div>
                        <span class="text-black bg-white px-2 py-1 rounded">${emp.employee_name}</span><br>
                        <small class="text-muted">${emp.position || 'N/A'}</small>
                    </div>
                </td>
                <td><span class="text-black bg-white px-2 py-1 rounded">${emp.days_worked}</span></td>
                <td><span class="text-black bg-white px-2 py-1 rounded">${emp.total_overtime.toFixed(1)}h</span></td>
            </tr>
        `;
    });

    summaryHtml += `
                </tbody>
            </table>
        </div>
        
        <h4 class="text-white mb-3">Detalles por Día</h4>
    `;

    // Mostrar tabla de detalles diarios
    tbody.innerHTML = summaryHtml + `
        <table class="table admin-table">
            <thead>
                <tr>
                    <th>Empleado</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Normales</th>
                    <th>Extras</th>
                    <th>Registros</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    const dailySummaries = Object.values(employeeDays).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    dailySummaries.forEach(day => {
        const dateObj = new Date(day.date);
        const dateStr = formatDateColombia(dateObj);
        
        tbody.innerHTML += `
            <tr class="table-light">
                <td>
                    <div>
                        <span class="text-black bg-white px-2 py-1 rounded">${day.employee_name}</span><br>
                        <span class="text-black bg-white px-2 py-1 rounded">${day.position || 'N/A'}</span>
                    </div>
                </td>
                <td><span class="text-black bg-white px-2 py-1 rounded">${dateStr}</span></td>
                <td>
                    <span class="badge bg-primary">
                        <i class="fas fa-clock me-1"></i>${day.displayTime}
                    </span>
                </td>
                <td>
                    <span class="badge ${day.overtimeHours > 0 ? 'bg-warning' : 'bg-secondary'}">
                        <i class="fas fa-hourglass-half me-1"></i>${day.overtimeHours.toFixed(1)}h
                    </span>
                </td>
                <td>
                    <small class="text-muted">${day.records.length} registros</small>
                </td>
                <td>
                    <button onclick="showEmployeeDayDetails('${day.employee_name}', '${day.date}')" 
                            class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-list me-1"></i>Ver Detalles
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML += `
            </tbody>
        </table>
    `;
}

function showEmployees() {
    document.getElementById('employeesSection').classList.remove('hidden');
    document.getElementById('attendanceSection').classList.add('hidden');
    loadEmployees();
}

function showAllAttendance() {
    document.getElementById('employeesSection').classList.add('hidden');
    document.getElementById('attendanceSection').classList.remove('hidden');
    loadAllAttendance();
}

function showAddEmployee() {
    const modal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
    modal.show();
}

function showEmployeeDayDetails(employeeName, date) {
    // Obtener todos los registros del empleado en esa fecha
    const dayRecords = allAttendanceRecords.filter(record => 
        record.employee_name === employeeName && 
        new Date(record.timestamp).toDateString() === date
    );
    
    if (dayRecords.length === 0) {
        alert('No hay registros para este día');
        return;
    }
    
    // Ordenar registros por hora
    const sortedRecords = dayRecords.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Crear modal con detalles
    const modalHtml = `
        <div class="modal fade" id="dayDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-calendar-day me-2"></i>
                            Detalles de ${employeeName} - ${new Date(date).toLocaleDateString('es-ES')}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h6 class="card-title">Total del Día</h6>
                                        <h4 class="text-primary">${calculateDayTotal(sortedRecords)}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h6 class="card-title">Horas Normales</h6>
                                        <h4 class="text-success">${Math.min(9, Math.floor(calculateDayMinutes(sortedRecords) / 60))}h</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h6 class="card-title">Horas Extras</h6>
                                        <h4 class="text-warning">${Math.max(0, Math.floor(calculateDayMinutes(sortedRecords) / 60) - 9)}h</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h6 class="card-title">Registros</h6>
                                        <h4 class="text-info">${sortedRecords.length}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Hora</th>
                                        <th>Tipo</th>
                                        <th>Ubicación</th>
                                        <th>Foto</th>
                                        <th>Mapa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sortedRecords.map(record => {
                                        const date = new Date(record.timestamp);
                                        const typeIcon = record.type === 'entry' ? 'sign-in-alt' : 'sign-out-alt';
                                        const typeText = record.type === 'entry' ? 'Entrada' : 'Salida';
                                        const typeBadge = record.type === 'entry' ? 'success' : 'danger';
                                        
                                        return `
                                            <tr>
                                                <td>
                                                    <span class="text-black bg-white px-2 py-1 rounded">${formatTimeColombia(date)}</span><br>
                                                    <span class="text-black bg-white px-2 py-1 rounded">${formatDateColombia(date)}</span>
                                                </td>
                                                <td>
                                                    <span class="badge bg-${typeBadge}">
                                                        <i class="fas fa-${typeIcon} me-1"></i>${typeText}
                                                    </span>
                                                </td>
                                                <td>
                                                    ${record.latitude ? `
                                                        <span class="text-black bg-white px-2 py-1 rounded">
                                                            <i class="fas fa-map-marker-alt me-1"></i>
                                                            ${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}
                                                        </span>
                                                    ` : '<span class="text-muted">N/A</span>'}
                                                </td>
                                                <td>
                                                    ${record.photo_path ? `
                                                        <img src="/uploads/${record.photo_path}" 
                                                             class="photo-thumbnail" 
                                                             onclick="window.open('/uploads/${record.photo_path}', '_blank')"
                                                             alt="Foto de ${typeText}">
                                                    ` : '<span class="text-muted">N/A</span>'}
                                                </td>
                                                <td>
                                                    ${record.latitude ? `
                                                        <button onclick="showLocationOnMap(${record.latitude}, ${record.longitude}, '${employeeName}')" 
                                                                class="btn btn-sm btn-outline-primary">
                                                            <i class="fas fa-map me-1"></i>Maps
                                                        </button>
                                                    ` : '<span class="text-muted">N/A</span>'}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal anterior si existe
    const existingModal = document.getElementById('dayDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('dayDetailsModal'));
    modal.show();
    
    // Limpiar modal al cerrar
    document.getElementById('dayDetailsModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

function calculateDayMinutes(records) {
    let totalMinutes = 0;
    let entryTime = null;
    
    const sortedRecords = records.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
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
    
    // Si hay una entrada sin salida (trabajando actualmente)
    if (entryTime) {
        const now = new Date();
        const diffMinutes = Math.round((now - entryTime) / (1000 * 60));
        totalMinutes += diffMinutes;
    }
    
    return totalMinutes;
}

function calculateDayTotal(records) {
    const totalMinutes = calculateDayMinutes(records);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

let allAttendanceRecords = [];

async function showLocationOnMap(latitude, longitude, employeeName) {
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=18`;
    
    // Crear modal para mostrar detalles
    const modalHtml = `
        <div class="modal fade" id="locationModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-map-marked-alt me-2"></i>
                            Ubicación de ${employeeName}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="fas fa-info-circle me-2"></i>Información</h6>
                                <p><strong>Empleado:</strong> ${employeeName}</p>
                                <p><strong>Latitud:</strong> ${latitude.toFixed(6)}</p>
                                <p><strong>Longitud:</strong> ${longitude.toFixed(6)}</p>
                                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                            </div>
                            <div class="col-md-6">
                                <h6><i class="fas fa-map me-2"></i>Mapa</h6>
                                <iframe 
                                    width="100%" 
                                    height="300" 
                                    frameborder="0" 
                                    style="border:0; border-radius: 8px;"
                                    src="https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed"
                                    allowfullscreen>
                                </iframe>
                            </div>
                        </div>
                        <div class="mt-3">
                            <a href="${mapsUrl}" 
                               target="_blank" 
                               class="btn btn-primary">
                                <i class="fas fa-external-link-alt me-2"></i>
                                Abrir en Google Maps
                            </a>
                            <button class="btn btn-secondary ms-2" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal anterior si existe
    const existingModal = document.getElementById('locationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('locationModal'));
    modal.show();
    
    // Limpiar modal al cerrar
    document.getElementById('locationModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

async function addEmployee() {
    const name = document.getElementById('empName').value;
    const email = document.getElementById('empEmail').value;
    const password = document.getElementById('empPassword').value;
    const position = document.getElementById('empPosition').value;
    
    if (!name || !email || !password) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: JSON.stringify({ name, email, password, position })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Empleado creado correctamente');
            bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal')).hide();
            document.getElementById('addEmployeeForm').reset();
            loadEmployees();
        } else {
            alert(data.error || 'Error al crear empleado');
        }
    } catch (error) {
        alert('Error de conexión. Intente nuevamente.');
    }
}

async function deleteEmployee(employeeId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este empleado? Esta acción eliminará al usuario y todos sus registros de asistencia y no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/employees/${employeeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            }
        });

        if (response.ok) {
            alert('Empleado eliminado exitosamente');
            loadEmployees(); // Recargar lista de empleados
        } else {
            alert('Error al eliminar el empleado');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el empleado');
    }
}
