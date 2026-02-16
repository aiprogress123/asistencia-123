let currentUser = null;
let currentLocation = null;
let cameraStream = null;
let photoData = null;
let currentCamera = 'user'; // 'user' para frontal, 'environment' para trasera
let availableCameras = [];

// Definición temprana de loadAllAttendance para evitar ReferenceError
function loadAllAttendance() {
    console.log('🚀 loadAllAttendance() llamada - versión temprana');
    // Esta función será redefinida más tarde con la implementación completa
    if (typeof loadAllAttendanceImpl === 'function') {
        return loadAllAttendanceImpl();
    } else {
        console.error('❌ Implementación de loadAllAttendance no disponible aún');
        showCustomAlert('❌ Error', 'Recarga la página e intenta nuevamente', 'warning');
    }
}

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

// Función para validar email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para mostrar alertas personalizadas con estilo
function showCustomAlert(title, message, type = 'info') {
    // Crear modal personalizado más llamativo
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
            backdrop-filter: blur(5px);
            animation: modalFadeIn 0.3s ease-out;
        ">
            <div style="
                background: ${type === 'danger' ? 'linear-gradient(135deg, rgba(255, 0, 0, 0.95), rgba(255, 100, 100, 0.95))' : 
                          type === 'warning' ? 'linear-gradient(135deg, rgba(255, 150, 0, 0.95), rgba(255, 200, 100, 0.95))' : 
                          'linear-gradient(135deg, rgba(0, 212, 255, 0.95), rgba(0, 168, 204, 0.95))'};
                border: 3px solid ${type === 'danger' ? '#ff0000' : type === 'warning' ? '#ff9800' : '#00d4ff'};
                border-radius: 20px;
                padding: 2.5rem;
                max-width: 450px;
                width: 90%;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(10px);
                position: relative;
                overflow: hidden;
                animation: modalSlideIn 0.5s ease-out, modalPulse 2s ease-in-out infinite;
            ">
                <div style="
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                    animation: shimmer 1.5s linear infinite;
                "></div>
                
                <div style="
                    text-align: center;
                    margin-bottom: 2rem;
                    position: relative;
                    z-index: 10;
                ">
                    <div style="
                        font-size: 2.5rem;
                        margin-bottom: 1rem;
                        color: ${type === 'danger' ? '#ffffff' : type === 'warning' ? '#ffffff' : '#00d4ff'};
                        text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
                        animation: titlePulse 1s ease-in-out infinite;
                    ">${title}</div>
                    
                    <div style="
                        color: #ffffff;
                        font-size: 1.1rem;
                        line-height: 1.6;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
                        font-weight: 600;
                        animation: textGlow 2s ease-in-out infinite;
                    ">${message}</div>
                </div>
                
                <div style="
                    text-align: center;
                    margin-top: 2rem;
                    position: relative;
                    z-index: 10;
                ">
                    <button onclick="closeCustomAlert()" style="
                        background: linear-gradient(45deg, ${type === 'danger' ? '#ff0000' : type === 'warning' ? '#ff9800' : '#00d4ff'}, ${type === 'danger' ? '#cc0000' : type === 'warning' ? '#cc7700' : '#00a8cc'});
                        border: 2px solid #ffffff;
                        color: white;
                        padding: 1rem 2.5rem;
                        border-radius: 15px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                        font-size: 1.1rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        animation: buttonPulse 1.5s ease-in-out infinite;
                    ">
                        <i class="fas fa-check me-2"></i>ENTENDIDO
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Agregar estilos CSS para animaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
            from { 
                transform: scale(0.5) translateY(-50px); 
                opacity: 0; 
            }
            to { 
                transform: scale(1) translateY(0); 
                opacity: 1; 
            }
        }
        
        @keyframes modalPulse {
            0%, 100% { 
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4); 
            }
            50% { 
                box-shadow: 0 30px 60px ${type === 'danger' ? 'rgba(255, 0, 0, 0.6)' : type === 'warning' ? 'rgba(255, 150, 0, 0.6)' : 'rgba(0, 212, 255, 0.6)'}; 
            }
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
        
        @keyframes titlePulse {
            0%, 100% { 
                transform: scale(1); 
                text-shadow: 0 0 20px rgba(255, 255, 255, 0.8); 
            }
            50% { 
                transform: scale(1.05); 
                text-shadow: 0 0 30px rgba(255, 255, 255, 1); 
            }
        }
        
        @keyframes textGlow {
            0%, 100% { 
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8); 
            }
            50% { 
                text-shadow: 0 2px 8px rgba(0, 0, 0, 1); 
            }
        }
        
        @keyframes buttonPulse {
            0%, 100% { 
                transform: scale(1); 
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3); 
            }
            50% { 
                transform: scale(1.05); 
                box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5); 
            }
        }
        
        #customAlertModal button:hover {
            transform: scale(1.1) translateY(-3px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
        }
    `;
    document.head.appendChild(style);
}

// Función para cerrar alerta personalizada
function closeCustomAlert() {
    const modal = document.getElementById('customAlertModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('progressToken');
    if (token) {
        const user = JSON.parse(localStorage.getItem('progressUser'));
        loginSuccess(user, token);
    }
    
    // Detectar si está en modo PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Aplicación ejecutándose en modo PWA');
        document.body.classList.add('pwa-mode');
    }
    
    // Detectar conexión a internet
    window.addEventListener('online', () => {
        showCustomAlert('🌐 Conexión Restablecida', 'Ahora estás conectado a internet', 'success');
    });
    
    window.addEventListener('offline', () => {
        showCustomAlert('📵 Sin Conexión', 'Trabajando en modo offline. Algunas funciones pueden no estar disponibles.', 'warning');
    });
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validaciones
    if (!email || !password) {
        showCustomAlert('❌ Error', 'Por favor completa todos los campos', 'danger');
        return;
    }
    
    if (!validateEmail(email)) {
        showCustomAlert('❌ Error', 'Por favor ingresa un email válido', 'danger');
        return;
    }
    
    // Mostrar loading
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando Sesión...';
    submitBtn.disabled = true;
    
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
            showCustomAlert('❌ Error', data.error || 'Credenciales incorrectas', 'danger');
        }
    } catch (error) {
        showCustomAlert('❌ Error', 'No se pudo conectar con el servidor', 'danger');
    } finally {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

function loginSuccess(user, token) {
    console.log('🎉 Login exitoso, procesando usuario...');
    console.log('👤 Datos del usuario:', user);
    console.log('🔑 Token recibido:', token ? 'sí' : 'no');

    
    currentUser = user;
    localStorage.setItem('progressToken', token);
    localStorage.setItem('progressUser', JSON.stringify(user));
    
    console.log('💾 Datos guardados en localStorage');
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    console.log('🔄 Cambiando de vista: login → mainApp');
    
    // Determinar el rol y texto a mostrar
    let roleText = 'Empleado';
    if (user.role === 'admin') {
        roleText = 'Administrador';
    } else if (user.role === 'coordinator') {
        roleText = 'Coordinador';
    } else if (user.role === 'ban') {
        roleText = 'Van';
    }
    
    console.log('🏷️ Rol detectado:', user.role, '-', roleText);
    
    document.getElementById('userInfo').innerHTML = `
        <div class="d-inline-block">
            <span class="text-white fw-bold me-2">PROGRESS NET</span>
            <span class="text-muted">|</span>
            <span class="text-black bg-white px-2 py-1 rounded">${user.name}</span>
            <span class="text-muted">(${roleText})</span>
        </div>
    `;
    
    console.log('🎨 UI de usuario actualizada');
    
    // Admin y Coordinador ven el panel de administración
    if (user.role === 'admin' || user.role === 'coordinator') {
        console.log('🛡️ Mostrando vista de administrador/coordinador');
        document.getElementById('employeeView').classList.add('hidden');
        document.getElementById('adminView').classList.remove('hidden');
        
        // Mostrar/ocultar botones según el rol
        updateAdminUI(user.role);
        
        // Cargar datos según el rol
        if (user.role === 'admin') {
            console.log('👥 Cargando empleados (admin)');
            loadEmployees(); // Admin puede ver y editar empleados
        } else {
            console.log('📊 Cargando todos los registros (coordinador)');
            loadAllAttendance(); // Coordinador solo ve registros
        }
    } else {
        console.log('👷 Mostrando vista de empleado');
        // Empleados y Ban ven su vista normal
        document.getElementById('employeeView').classList.remove('hidden');
        document.getElementById('adminView').classList.add('hidden');
        loadMyAttendance();
        getLocation();
    }
    
    console.log('✅ Proceso de login completado');
}

// Función para actualizar la interfaz según el rol
function updateAdminUI(userRole) {
    // Botones que solo los administradores pueden ver
    const adminOnlyButtons = [
        'addEmployeeBtn',
        'adminExitBtn'
    ];
    
    adminOnlyButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            if (userRole === 'admin') {
                btn.style.display = 'inline-block';
            } else {
                btn.style.display = 'none';
            }
        }
    });
    
    // Mostrar información del rol SOLO para coordinadores
    const roleInfo = document.getElementById('roleInfo');
    if (userRole === 'coordinator') {
        if (!roleInfo) {
            const roleInfoDiv = document.createElement('div');
            roleInfoDiv.id = 'roleInfo';
            roleInfoDiv.className = 'alert alert-info mb-3';
            roleInfoDiv.innerHTML = `
                <i class="fas fa-info-circle me-2"></i>
                <strong>Modo Coordinador</strong><br>
                Puedes ver todos los registros de asistencia y horas extras, pero no puedes modificar datos de empleados.
            `;
            
            // Insertar antes de la primera sección del admin
            const adminView = document.getElementById('adminView');
            const firstSection = adminView.querySelector('.mb-4');
            if (firstSection) {
                adminView.insertBefore(roleInfoDiv, firstSection);
            }
        }
    } else {
        // Si no es coordinador, eliminar el letrero si existe
        if (roleInfo) {
            roleInfo.remove();
        }
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
    
    // Convertir a blob directamente
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            photoData = canvas.toDataURL('image/jpeg');
            resolve(blob);
        }, 'image/jpeg');
    });
}

// Función para verificar y mostrar el botón de cambiar cámara
async function checkAndShowSwitchCameraButton() {
    try {
        // Obtener lista de dispositivos de video
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Si hay más de una cámara, mostrar el botón
        const switchBtn = document.getElementById('switchCameraBtn');
        if (videoDevices.length > 1) {
            switchBtn.style.display = 'inline-block';
            availableCameras = videoDevices;
            console.log(`Se encontraron ${videoDevices.length} cámaras disponibles`);
        } else {
            switchBtn.style.display = 'none';
            console.log('Solo se encontró una cámara');
        }
    } catch (error) {
        console.error('Error al verificar cámaras:', error);
        document.getElementById('switchCameraBtn').style.display = 'none';
    }
}

// Función para cambiar entre cámaras frontal y trasera
async function switchCamera() {
    if (!cameraStream) {
        alert('Por favor, activa la cámara primero');
        return;
    }
    
    try {
        // Detener stream actual
        cameraStream.getTracks().forEach(track => track.stop());
        
        // Alternar entre cámaras
        currentCamera = currentCamera === 'user' ? 'environment' : 'user';
        
        // Intentar obtener acceso a la nueva cámara
        const constraints = { 
            video: { 
                facingMode: currentCamera,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraStream = stream;
        
        const video = document.getElementById('video');
        video.srcObject = cameraStream;
        video.play();
        
        // Actualizar texto del botón
        const switchBtn = document.getElementById('switchCameraBtn');
        const cameraType = currentCamera === 'user' ? 'frontal' : 'trasera';
        switchBtn.innerHTML = `<i class="fas fa-sync-alt me-1"></i>Cámara ${cameraType}`;
        
        // Mostrar mensaje de confirmación
        const cameraIcon = currentCamera === 'user' ? '🤳' : '📷';
        showCustomAlert('📸 Cámara Cambiada', `Se ha cambiado a la cámara ${cameraType} ${cameraIcon}`, 'info');
        
    } catch (error) {
        console.error('Error al cambiar cámara:', error);
        
        // Revertir al modo anterior si falla
        currentCamera = currentCamera === 'user' ? 'environment' : 'user';
        
        // Intentar recuperar la cámara anterior
        try {
            const fallbackConstraints = { video: { facingMode: currentCamera } };
            const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            cameraStream = stream;
            
            const video = document.getElementById('video');
            video.srcObject = cameraStream;
            video.play();
        } catch (fallbackError) {
            console.error('Error al recuperar cámara:', fallbackError);
            alert('No se pudo cambiar de cámara. Por favor, intenta nuevamente.');
        }
    }
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
        
        // Si hay una entrada sin salida (trabajando actualmente)
        if (entryTime) {
            const now = new Date();
            const diffMinutes = Math.round((now - entryTime) / (1000 * 60));
            totalMinutes += diffMinutes;
        }
        
        // Para usuarios ban, no calcular horas extras
        if (userRole === 'ban') {
            day.totalMinutes = 0;
            day.regularHours = 0;
            day.overtimeHours = 0;
            day.displayTime = 'Sin Turno Fijo';
        } else {
            day.totalMinutes = totalMinutes;
            day.regularHours = Math.min(9, Math.floor(totalMinutes / 60));
            day.overtimeHours = Math.max(0, totalMinutes / 60 - 9);
            day.displayTime = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
        }
        
        day.colombiaTime = formatDateTimeColombia(new Date(day.records[0].timestamp));
    });

    // Mostrar resumen de horas trabajadas
    const totalRegularHours = Object.values(dailyRecords).reduce((sum, day) => sum + day.regularHours, 0);
    const totalOvertimeHours = Object.values(dailyRecords).reduce((sum, day) => sum + day.overtimeHours, 0);
    const daysWorked = Object.keys(dailyRecords).length;

    // Para usuarios ban, mostrar resumen diferente
    const summaryHtml = userRole === 'ban' ? `
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card text-center">
                    <div class="card-body">
                        <h6 class="card-title">Estado de Registro</h6>
                        <h4 class="text-info">Sin Turno Fijo</h4>
                        <p class="text-muted mb-0">Usuario con rol Ban - No acumula horas extras</p>
                    </div>
                </div>
            </div>
        </div>
    ` : `
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
                            ${day.overtimeHours > 0 && !isNaN(day.overtimeHours) ? `
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
    console.log('🔄 Cargando empleados...');
    
    // Mostrar estado de carga
    const tbody = document.getElementById('employeesTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner spinner-sm"></div> Cargando empleados...</td></tr>';
    }
    
    try {
        const token = localStorage.getItem('progressToken');
        console.log('🔑 Token:', token ? 'existe' : 'no existe');
        
        if (!token) {
            throw new Error('No hay token de autenticación');
        }
        
        const response = await fetch(`${API_BASE}/admin/employees`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta status:', response.status);
        console.log('📡 Respuesta headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor (texto):', errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            
            // Si es error de autorización, redirigir al login
            if (response.status === 401 || response.status === 403) {
                console.log('🔒 Error de autorización, redirigiendo al login...');
                logout();
                showCustomAlert('🔒 Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
                return;
            }
            
            throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('📄 Respuesta cruda:', responseText);
        
        let employees;
        try {
            employees = JSON.parse(responseText);
        } catch (e) {
            console.error('💥 Error al parsear JSON:', e);
            console.error('📄 Texto recibido:', responseText);
            throw new Error('La respuesta del servidor no es JSON válido');
        }
        
        console.log('👥 Empleados recibidos:', employees);
        console.log('📊 Cantidad de empleados:', employees.length);
        
        displayEmployees(employees);
    } catch (error) {
        console.error('💥 Error en loadEmployees:', error);
        
        let errorMessage = error.message;
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (error.name === 'SyntaxError') {
            errorMessage = 'Error en el formato de respuesta del servidor.';
        }
        
        const tbody = document.getElementById('employeesTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>Error al cargar empleados:</strong><br>
                            ${errorMessage}
                            <br><small class="text-muted">Intenta recargar la página</small>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Mostrar botón de reintentar
        setTimeout(() => {
            const retryBtn = document.createElement('button');
            retryBtn.innerHTML = '<i class="fas fa-sync me-2"></i>Reintentar';
            retryBtn.className = 'btn btn-primary mt-2';
            retryBtn.onclick = loadEmployees;
            
            const tbody = document.getElementById('employeesTableBody');
            if (tbody && tbody.querySelector('.alert-danger')) {
                const alertDiv = tbody.querySelector('.alert-danger');
                alertDiv.appendChild(document.createElement('br'));
                alertDiv.appendChild(retryBtn);
            }
        }, 1000);
    }
}

function displayEmployees(employees) {
    console.log('🎨 Mostrando empleados en la tabla:', employees.length);
    console.log('📋 Lista completa:', employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role
    })));
    
    const tbody = document.getElementById('employeesTableBody');
    
    if (employees.length === 0) {
        console.log('❌ No hay empleados para mostrar');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay empleados registrados</td></tr>';
        return;
    }
    
    // Obtener el rol del usuario actual
    const currentUser = JSON.parse(localStorage.getItem('progressUser'));
    const userRole = currentUser ? currentUser.role : 'employee';
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    console.log('👤 Usuario actual:', currentUser);
    console.log('🛡️ Es admin:', isAdmin);
    
    tbody.innerHTML = employees.map(emp => {
        console.log('🔄 Procesando empleado:', emp.name, 'rol:', emp.role);
        
        // Determinar el color y texto del rol
        let roleBadge = '';
        if (emp.role === 'admin') {
            roleBadge = '<span class="badge bg-danger">Administrador</span>';
        } else if (emp.role === 'coordinator') {
            roleBadge = '<span class="badge bg-warning text-dark">Coordinador</span>';
        } else if (emp.role === 'ban') {
            roleBadge = '<span class="badge bg-secondary">Van</span>';
        } else {
            roleBadge = '<span class="badge bg-primary">Empleado</span>';
        }
        
        console.log('🏷️ Badge para', emp.name, ':', roleBadge);
        
        // Botones de acción solo para administradores
        const actionButtons = isAdmin ? `
            <div class="dropdown">
                <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Acciones">
                    <i class="fas fa-cog"></i>
                    <span class="btn-text">Acciones</span>
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="editEmployeeName(${emp.id}, '${emp.name}', '${emp.email}')">
                        <i class="fas fa-edit text-info me-2"></i>Editar Nombre
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="changeEmployeeRole(${emp.id}, '${emp.name}', '${emp.role}')">
                        <i class="fas fa-user-tag text-warning me-2"></i>Cambiar Rol
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="deleteEmployee(${emp.id}, '${emp.name}')">
                        <i class="fas fa-trash me-2"></i>Eliminar Empleado
                    </a></li>
                </ul>
            </div>
        ` : '<span class="text-muted">Solo vista</span>';
        
        const rowHtml = `
            <tr>
                <td><span class="text-black bg-white px-2 py-1 rounded">${emp.id}</span></td>
                <td><span class="text-black bg-white px-2 py-1 rounded">${emp.name}</span></td>
                <td><span class="text-black bg-white px-2 py-1 rounded">${emp.email}</span></td>
                <td><span class="text-black bg-white px-2 py-1 rounded">${emp.position || 'Jefe'}</span></td>
                <td>${roleBadge}</td>
                <td><span class="text-black bg-white px-2 py-1 rounded">${formatDateColombia(new Date(emp.created_at))}</span></td>
                <td>${actionButtons}</td>
            </tr>
        `;
        
        console.log('✅ Fila generada para:', emp.name);
        return rowHtml;
    }).join('');
    
    console.log('✅ Tabla de empleados actualizada');
}

function editEmployeeName(employeeId, currentName, currentEmail) {
    const currentUser = JSON.parse(localStorage.getItem('progressUser'));
    
    if (currentUser.role !== 'admin') {
        showCustomAlert('❌ Error', 'Solo los administradores pueden editar nombres de empleados', 'danger');
        return;
    }
    
    // No permitir editar al propio admin
    if (currentUser.id === employeeId) {
        showCustomAlert('❌ Error', 'No puedes editar tu propio nombre', 'danger');
        return;
    }
    
    const modalHtml = `
        <div class="modal fade" id="editNameModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>
                            Editar Nombre de Empleado
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Empleado:</strong> ${currentName}<br>
                            <strong>Email:</strong> ${currentEmail}
                        </div>
                        
                        <form id="editNameForm">
                            <div class="mb-3">
                                <label for="newEmployeeName" class="form-label">
                                    <i class="fas fa-user me-1"></i>
                                    Nuevo Nombre Completo
                                </label>
                                <input type="text" 
                                       class="form-control" 
                                       id="newEmployeeName" 
                                       value="${currentName}"
                                       required
                                       minlength="3"
                                       maxlength="100">
                                <small class="text-muted">
                                    Ingresa el nuevo nombre completo del empleado
                                </small>
                            </div>
                            
                            <div class="mb-3">
                                <label for="editNameReason" class="form-label">
                                    <i class="fas fa-comment me-1"></i>
                                    Motivo del Cambio
                                </label>
                                <textarea class="form-control" 
                                          id="editNameReason" 
                                          rows="3" 
                                          placeholder="Describe el motivo por el cual estás cambiando el nombre..."
                                          required></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-info" onclick="updateEmployeeName(${employeeId}, '${currentName}')">
                            <i class="fas fa-save me-2"></i>Actualizar Nombre
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal anterior si existe
    const existingModal = document.getElementById('editNameModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editNameModal'));
    modal.show();
    
    // Limpiar modal al cerrar
    document.getElementById('editNameModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Función para actualizar el nombre del empleado
async function updateEmployeeName(employeeId, currentName) {
    const newName = document.getElementById('newEmployeeName').value.trim();
    const reason = document.getElementById('editNameReason').value.trim();
    
    // Validaciones
    if (!newName || !reason) {
        showCustomAlert('❌ Error', 'Por favor completa todos los campos', 'danger');
        return;
    }
    
    if (newName.length < 3) {
        showCustomAlert('❌ Error', 'El nombre debe tener al menos 3 caracteres', 'danger');
        return;
    }
    
    if (newName === currentName) {
        showCustomAlert('❌ Error', 'El nuevo nombre es igual al actual', 'danger');
        return;
    }
    
    // Confirmación
    if (!confirm(`⚠️ ¿Estás seguro de cambiar el nombre de "${currentName}" a "${newName}"?\n\nMotivo: ${reason}\n\nEsta acción actualizará el nombre en todos los registros anteriores.`)) {
        return;
    }
    
    // Obtener el usuario actual
    const currentUser = JSON.parse(localStorage.getItem('progressUser'));
    
    // Mostrar loading
    const updateButton = document.querySelector(`button[onclick="updateEmployeeName(${employeeId}, '${currentName}')"]`);
    const originalText = updateButton.innerHTML;
    updateButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
    updateButton.disabled = true;
    
    try {
        console.log('🚀 Enviando solicitud de cambio de nombre:', {
            url: `${API_BASE}/admin/employees/${employeeId}/name`,
            body: {
                name: newName,
                reason: reason,
                admin_name: currentUser.name
            }
        });
        
        const response = await fetch(`${API_BASE}/admin/employees/${employeeId}/name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: JSON.stringify({
                name: newName,
                reason: reason,
                admin_name: currentUser.name
            })
        });
        
        console.log('📡 Respuesta del servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📋 Datos recibidos:', data);
        
        if (response.ok) {
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('editNameModal')).hide();
            
            // Mostrar éxito
            showCustomAlert(
                '✅ Nombre Actualizado', 
                `El nombre ha sido cambiado de "${currentName}" a "${newName}".\n\nMotivo: ${reason}\n\nCambio realizado por: ${currentUser.name}`, 
                'success'
            );
            
            // Recargar lista de empleados
            loadEmployees();
            
        } else {
            console.error('❌ Error del servidor:', data);
            showCustomAlert('❌ Error', data.error || 'Error al actualizar el nombre', 'danger');
            
            // Restaurar botón
            updateButton.innerHTML = originalText;
            updateButton.disabled = false;
        }
        
    } catch (error) {
        console.error('🚨 Error de conexión:', error);
        showCustomAlert('❌ Error', 'Error de conexión. Intenta nuevamente', 'danger');
        
        // Restaurar botón
        updateButton.innerHTML = originalText;
        updateButton.disabled = false;
    }
}

// Función para cambiar el rol de un empleado
function changeEmployeeRole(employeeId, employeeName, currentRole) {
    const modalHtml = `
        <div class="modal fade" id="changeRoleModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user-tag me-2"></i>
                            Cambiar Rol de ${employeeName}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Empleado:</strong> ${employeeName}<br>
                            <strong>Rol Actual:</strong> <span class="badge ${getRoleBadgeClass(currentRole)}">${getRoleText(currentRole)}</span>
                        </div>
                        
                        <form id="changeRoleForm">
                            <div class="mb-3">
                                <label for="newRole" class="form-label">
                                    <i class="fas fa-user-tag me-1"></i>
                                    Nuevo Rol
                                </label>
                                <select class="form-control" id="newRole" required>
                                    <option value="">Selecciona un rol...</option>
                                    <option value="employee" ${currentRole === 'employee' ? 'selected' : ''}>Empleado</option>
                                    <option value="coordinator" ${currentRole === 'coordinator' ? 'selected' : ''}>Coordinador</option>
                                    <option value="ban" ${currentRole === 'ban' ? 'selected' : ''}>Van (Sin Turno Fijo)</option>
                                    <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Administrador</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="roleReason" class="form-label">
                                    <i class="fas fa-comment me-1"></i>
                                    Motivo del Cambio
                                </label>
                                <textarea class="form-control" 
                                          id="roleReason" 
                                          rows="3" 
                                          placeholder="Describe el motivo por el cual estás cambiando el rol de este empleado..."
                                          required></textarea>
                            </div>
                            
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Importante:</strong><br>
                                • <strong>Empleado:</strong> Acumula horas extras normales<br>
                                • <strong>Coordinador:</strong> Puede ver registros de otros empleados<br>
                                • <strong>Ban:</strong> No acumula horas extras, solo registra asistencia<br>
                                • <strong>Administrador:</strong> Control total del sistema
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-warning" onclick="updateEmployeeRole(${employeeId}, '${employeeName}')">
                            <i class="fas fa-user-tag me-2"></i>Cambiar Rol
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal anterior si existe
    const existingModal = document.getElementById('changeRoleModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('changeRoleModal'));
    modal.show();
    
    // Limpiar modal al cerrar
    document.getElementById('changeRoleModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Función para obtener la clase del badge según el rol
function getRoleBadgeClass(role) {
    switch(role) {
        case 'admin': return 'bg-danger';
        case 'coordinator': return 'bg-warning text-dark';
        case 'ban': return 'bg-secondary';
        default: return 'bg-primary';
    }
}

// Función para obtener el texto del rol
function getRoleText(role) {
    switch(role) {
        case 'admin': return 'Administrador';
        case 'coordinator': return 'Coordinador';
        case 'ban': return 'Van (Sin Turno Fijo)';
        default: return 'Empleado';
    }
}

// Función de diagnóstico para ngrok
async function diagnoseNgrokConnection() {
    if (!window.location.hostname.includes('ngrok')) {
        console.log('🌐 No estamos en ngrok, omitiendo diagnóstico');
        return true;
    }
    
    console.log('🔍 Iniciando diagnóstico de conexión ngrok...');
    
    try {
        // Probar endpoint de prueba
        const testResponse = await fetch(`${API_BASE}/ngrok-test`, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'X-Requested-With': 'XMLHttpRequest'
            },
            mode: 'cors',
            credentials: 'include'
        });
        
        console.log('📡 Respuesta del test endpoint:', testResponse.status);
        
        if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log('✅ Conexión ngrok exitosa:', testData);
            return true;
        } else {
            console.error('❌ Error en test endpoint:', testResponse.statusText);
            return false;
        }
    } catch (error) {
        console.error('❌ Error de diagnóstico ngrok:', error);
        return false;
    }
}

// Función para cargar todos los registros de asistencia (admin) - v2026
async function loadAllAttendanceImpl() {
    console.log('🚀 loadAllAttendance() llamada - v2026');
    try {
        console.log('📊 Cargando todos los registros de asistencia...');
        
        // Headers especiales para ngrok
        const headers = {
            'Authorization': `Bearer ${localStorage.getItem('progressToken')}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        };
        
        // Si estamos en ngrok, agregar headers adicionales
        if (window.location.hostname.includes('ngrok')) {
            headers['X-Requested-With'] = 'XMLHttpRequest';
            headers['Accept'] = 'application/json';
            headers['Cache-Control'] = 'no-cache';
            headers['Pragma'] = 'no-cache';
        }
        
        console.log('🌐 Detectando hostname:', window.location.hostname);
        console.log('🔑 Headers enviados:', headers);
        
        const response = await fetch(`${API_BASE}/admin/attendance`, {
            method: 'GET',
            headers: headers,
            mode: 'cors',
            credentials: 'include'
        });
        
        console.log('📡 Respuesta de /api/admin/attendance:', response.status);
        console.log('📡 Headers de respuesta:', [...response.headers.entries()]);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log('📡 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Respuesta no es JSON:', text.substring(0, 200));
            throw new Error('La respuesta no es JSON');
        }
        
        const records = await response.json();
        console.log('📋 Registros cargados:', records.length);
        
        // Guardar registros globalmente
        allAttendanceRecords = records;
        
        // Mostrar registros
        displayAllAttendanceRecords(records);
        
    } catch (error) {
        console.error('❌ Error cargando todos los registros:', error);
        const container = document.getElementById('attendanceTableBody');
        if (container) {
            // Si es un error de CORS o de ngrok, mostrar mensaje específico
            const isNgrokError = error.message.includes('CORS') || 
                                error.message.includes('NetworkError') || 
                                error.message.includes('Failed to fetch');
            
            if (isNgrokError && window.location.hostname.includes('ngrok')) {
                container.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            <div class="alert alert-warning m-2">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Error de conexión con ngrok</strong><br>
                                <small>Intenta recargar la página o verifica la conexión del túnel ngrok</small><br>
                                <button onclick="loadAllAttendance()" class="btn btn-sm btn-warning mt-2">
                                    <i class="fas fa-redo me-1"></i>Reintentar
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                container.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Error al cargar registros: ${error.message}
                        </td>
                    </tr>
                `;
            }
        }
    }
}

// Función para mostrar todos los registros de asistencia
function displayAllAttendanceRecords(records) {
    console.log('🎨 displayAllAttendanceRecords llamada con', records.length, 'registros');
    
    const container = document.getElementById('attendanceTableBody');
    
    if (!container) {
        console.error('❌ Contenedor attendanceTableBody no encontrado');
        return;
    }
    
    console.log('📋 Container encontrado:', container);
    
    if (records.length === 0) {
        console.log('📭 No hay registros, mostrando mensaje vacío');
        container.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros de asistencia</td></tr>';
        // Llamar al resumen solo si el contenedor está visible
        setTimeout(() => displayEmployeeSummary([]), 200);
        return;
    }
    
    console.log('📊 Procesando', records.length, 'registros...');
    
    // Generar HTML para tabla
    let html = '';
    
    console.log('🔄 Iniciando bucle de procesamiento de registros...');
    
    // Ordenar registros por timestamp (más reciente primero)
    const sortedRecords = records.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    sortedRecords.forEach((record, index) => {
        console.log(`📋 Procesando registro ${index + 1}:`, record.employee_name, record.type, 'a las', record.timestamp);
        
        const date = new Date(record.timestamp);
        const dateStr = date.toLocaleDateString('es-CO');
        const timeStr = date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const typeIcon = record.type === 'entry' ? '🟢' : '🔴';
        const typeText = record.type === 'entry' ? 'Entrada' : 'Salida';
        const typeClass = record.type === 'entry' ? 'success' : 'danger';
        
        // Crear miniatura de la foto
        const photoThumbnail = record.photo_path 
            ? `<img src="/uploads/${record.photo_path}" 
                   alt="Foto del registro" 
                   class="img-thumbnail" 
                   style="width: 40px; height: 40px; object-fit: cover; cursor: pointer; border: 1px solid var(--progress-teal);"
                   onclick="showRecordDetails(${JSON.stringify(record).replace(/"/g, '&quot;')})"
                   title="Click para ver detalles">`
            : '<span class="text-muted">N/A</span>';
        
        const actionButtons = `<button class="btn btn-sm btn-primary" 
                onclick="showRecordDetails(${JSON.stringify(record).replace(/"/g, '&quot;')})"
                title="Ver detalles completos">
                 <i class="fas fa-eye"></i> Detalles
               </button>`;
        
        html += `
            <tr>
                <td><span class="text-black bg-white px-2 py-1 rounded" style="color: #000000 !important; font-weight: 500 !important;">${record.employee_name || 'N/A'}</span></td>
                <td><span class="badge bg-${typeClass}">${typeIcon} ${typeText}</span></td>
                <td><span class="text-black bg-white px-2 py-1 rounded" style="color: #000000 !important; font-weight: 500 !important;">${dateStr}<br><small style="color: #000000 !important; font-weight: 500 !important; font-size: inherit !important;">${timeStr}</small></span></td>
                <td class="text-center">${photoThumbnail}</td>
                <td><span class="text-black bg-white px-2 py-1 rounded" style="color: #000000 !important; font-weight: 500 !important;">${actionButtons}</span></td>
            </tr>
        `;
    });
    
    console.log('🔄 Bucle finalizado, HTML generado:', html.length, 'caracteres');
    console.log('🎨 Actualizando container...');
    
    container.innerHTML = html;
    console.log('✅ Container actualizado con éxito');
    
    // Llamar al resumen con un pequeño retraso para asegurar que el DOM esté listo
    setTimeout(() => displayEmployeeSummary(records), 200);
}

// Función para mostrar resumen de ingresos por empleado
function displayEmployeeSummary(records) {
    console.log('📊 Generando resumen de ingresos por empleado...');
    
    // Función de reinteto mejorada
    function tryDisplaySummary(attempt = 1) {
        const summaryContainer = document.getElementById('employeeSummary');
        
        // Verificar si la sección de asistencia está visible
        const attendanceSection = document.getElementById('attendanceSection');
        const isAttendanceSectionVisible = attendanceSection && !attendanceSection.classList.contains('hidden');
        
        if (!summaryContainer) {
            console.error(`❌ Contenedor employeeSummary no encontrado (intento ${attempt})`);
            if (attempt < 5) {
                console.log(`🔄 Reintentando en ${attempt * 200}ms...`);
                setTimeout(() => tryDisplaySummary(attempt + 1), attempt * 200);
            } else {
                console.error('❌ No se pudo encontrar el contenedor después de 5 intentos');
            }
            return;
        }
        
        // Si la sección de asistencia no está visible, no mostrar el resumen
        if (!isAttendanceSectionVisible) {
            console.log('📋 La sección de asistencia no está visible, omitiendo resumen');
            return;
        }
        
        // Verificar si el contenedor está visible
        if (summaryContainer.offsetParent === null) {
            console.log(`📋 Contenedor employeeSummary no está visible (intento ${attempt})`);
            if (attempt < 5) {
                console.log(`🔄 Reintentando visibilidad en ${attempt * 200}ms...`);
                setTimeout(() => tryDisplaySummary(attempt + 1), attempt * 200);
            } else {
                console.error('❌ Contenedor no visible después de 5 intentos');
            }
            return;
        }
        
        console.log('✅ Contenedor employeeSummary encontrado y visible');
        
        if (records.length === 0) {
            summaryContainer.innerHTML = `
                <div class="col-12 text-center text-white">
                    <i class="fas fa-info-circle fa-2x mb-2"></i>
                    <p>No hay registros de asistencia para mostrar en el resumen</p>
                </div>
            `;
            return;
        }
        
        // Agrupar registros por empleado y calcular ingresos y horas extras
        const employeeStats = {};
        
        records.forEach(record => {
            const name = record.employee_name || 'Desconocido';
            
            if (!employeeStats[name]) {
                employeeStats[name] = {
                    name: name,
                    totalEntries: 0,
                    totalExits: 0,
                    entries: [],
                    exits: [],
                    dailyOvertime: {},  // Horas extras por día
                    totalOvertime: 0    // Total horas extras
                };
            }
            
            if (record.type === 'entry') {
                employeeStats[name].totalEntries++;
                employeeStats[name].entries.push(new Date(record.timestamp));
            } else if (record.type === 'exit') {
                employeeStats[name].totalExits++;
                employeeStats[name].exits.push(new Date(record.timestamp));
            }
        });
        
        // Calcular horas extras por empleado
        Object.keys(employeeStats).forEach(empName => {
            const stats = employeeStats[empName];
            const dailyOvertime = {};
            let totalOvertime = 0;
            
            // Agrupar entradas y salidas por día
            const dailyRecords = {};
            
            // Procesar entradas
            stats.entries.forEach(entry => {
                const dateKey = entry.toLocaleDateString('es-CO');
                if (!dailyRecords[dateKey]) {
                    dailyRecords[dateKey] = { entries: [], exits: [] };
                }
                dailyRecords[dateKey].entries.push(entry);
            });
            
            // Procesar salidas
            stats.exits.forEach(exit => {
                const dateKey = exit.toLocaleDateString('es-CO');
                if (!dailyRecords[dateKey]) {
                    dailyRecords[dateKey] = { entries: [], exits: [] };
                }
                dailyRecords[dateKey].exits.push(exit);
            });
            
            // Calcular horas trabajadas por día
            Object.keys(dailyRecords).forEach(dateKey => {
                const dayRecords = dailyRecords[dateKey];
                let dayHours = 0;
                
                // Emparejar entradas con salidas
                const pairs = Math.min(dayRecords.entries.length, dayRecords.exits.length);
                
                for (let i = 0; i < pairs; i++) {
                    const entry = dayRecords.entries[i];
                    const exit = dayRecords.exits[i];
                    
                    if (entry && exit && exit > entry) {
                        const hoursWorked = (exit - entry) / (1000 * 60 * 60); // Convertir a horas
                        
                        // Considerar máximo 12 horas trabajadas por día (para evitar errores)
                        const validHours = Math.min(hoursWorked, 12);
                        
                        // Calcular horas extras (más de 9 horas es extra)
                        const overtime = Math.max(0, validHours - 9);
                        
                        if (overtime > 0) {
                            dayHours += overtime;
                            dailyOvertime[dateKey] = overtime;
                        }
                    }
                }
                
                totalOvertime += dayHours;
            });
            
            stats.dailyOvertime = dailyOvertime;
            stats.totalOvertime = totalOvertime;
        });
        
        // Generar HTML para el resumen
        let summaryHtml = '';
        
        Object.values(employeeStats).forEach(stats => {
            const totalRecords = stats.totalEntries + stats.totalExits;
            const percentage = totalRecords > 0 ? ((stats.totalEntries / totalRecords) * 100).toFixed(1) : 0;
            
            // Calcular horas extras quincenales (aproximadas)
            const dailyOvertimeDays = Object.keys(stats.dailyOvertime).length;
            const avgDailyOvertime = dailyOvertimeDays > 0 ? stats.totalOvertime / dailyOvertimeDays : 0;
            const estimatedQuincenalOvertime = avgDailyOvertime * 15; // 15 días quincena
            
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
                                    <div class="text-warning">
                                        <i class="fas fa-clock fa-lg mb-1"></i>
                                        <h6 class="mb-0">${stats.totalOvertime.toFixed(1)}</h6>
                                        <small>Extras H</small>
                                    </div>
                                </div>
                            </div>
                            <div class="row text-center">
                                <div class="col-6">
                                    <small class="text-white-50">Diarias:</small>
                                    <div class="text-info fw-bold">${avgDailyOvertime.toFixed(1)}h</div>
                                </div>
                                <div class="col-6">
                                    <small class="text-white-50">Quincenal:</small>
                                    <div class="text-warning fw-bold">${estimatedQuincenalOvertime.toFixed(1)}h</div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <div class="progress" style="height: 8px; background: rgba(255, 255, 255, 0.2);">
                                    <div class="progress-bar bg-success" style="width: ${percentage}%;"></div>
                                </div>
                                <small class="text-white">${percentage}% entradas</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        summaryContainer.innerHTML = summaryHtml;
        console.log('✅ Resumen de ingresos actualizado');
    }
    
    // Iniciar la espera del elemento
    tryDisplaySummary();
}

function showEmployees() {
    console.log('🔄 Mostrando sección de empleados');
    document.getElementById('employeesSection').classList.remove('hidden');
    document.getElementById('attendanceSection').classList.add('hidden');
    loadEmployees();
}

function showAllAttendance() {
    console.log('🔄 showAllAttendance() llamada - v2026');
    console.log('🔄 Mostrando sección de todos los registros');
    console.log('🔍 Verificando elementos DOM...');
    
    // Verificar si loadAllAttendance está definida
    if (typeof loadAllAttendance !== 'function') {
        console.error('❌ loadAllAttendance no está definida. Intentando recargar...');
        showCustomAlert('❌ Error', 'Función no disponible. Recarga la página.', 'danger');
        return;
    }
    
    const employeesSection = document.getElementById('employeesSection');
    const attendanceSection = document.getElementById('attendanceSection');
    
    console.log('📋 employeesSection:', employeesSection ? 'encontrado' : 'NO ENCONTRADO');
    console.log('📋 attendanceSection:', attendanceSection ? 'encontrado' : 'NO ENCONTRADO');
    
    if (!employeesSection || !attendanceSection) {
        console.error('❌ Elementos DOM no encontrados');
        showCustomAlert('❌ Error', 'No se encontraron los elementos necesarios', 'danger');
        return;
    }
    
    employeesSection.classList.add('hidden');
    attendanceSection.classList.remove('hidden');
    
    console.log('🔄 Elementos actualizados, cargando registros directamente...');
    
    // Cargar registros directamente aquí para evitar ReferenceError
    setTimeout(async () => {
        try {
            // Si estamos en ngrok, hacer diagnóstico primero
            if (window.location.hostname.includes('ngrok')) {
                console.log('🌐 Detectado ngrok, ejecutando diagnóstico...');
                const isNgrokWorking = await diagnoseNgrokConnection();
                
                if (!isNgrokWorking) {
                    throw new Error('La conexión con ngrok no está funcionando. Verifica que el túnel esté activo.');
                }
            }
            
            console.log('📊 Cargando todos los registros de asistencia...');
            
            // Headers especiales para ngrok
            const headers = {
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            };
            
            // Si estamos en ngrok, agregar headers adicionales
            if (window.location.hostname.includes('ngrok')) {
                headers['X-Requested-With'] = 'XMLHttpRequest';
                headers['Accept'] = 'application/json';
                headers['Cache-Control'] = 'no-cache';
                headers['Pragma'] = 'no-cache';
            }
            
            console.log('🌐 Detectando hostname:', window.location.hostname);
            console.log('🔑 Headers enviados:', headers);
            
            const response = await fetch(`${API_BASE}/admin/attendance`, {
                method: 'GET',
                headers: headers,
                mode: 'cors',
                credentials: 'include'
            });
            
            console.log('📡 Respuesta de /api/admin/attendance:', response.status);
            console.log('📡 Headers de respuesta:', [...response.headers.entries()]);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            console.log('📡 Content-Type:', contentType);
            
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Respuesta no es JSON:', text.substring(0, 200));
                throw new Error('La respuesta no es JSON');
            }
            
            const records = await response.json();
            console.log('📋 Registros cargados:', records.length);
            
            // Guardar registros globalmente
            allAttendanceRecords = records;
            
            // Mostrar registros
            displayAllAttendanceRecords(records);
            
        } catch (error) {
            console.error('❌ Error cargando todos los registros:', error);
            const container = document.getElementById('attendanceTableBody');
            if (container) {
                // Si es un error de CORS o de ngrok, mostrar mensaje específico
                const isNgrokError = error.message.includes('CORS') || 
                                    error.message.includes('NetworkError') || 
                                    error.message.includes('Failed to fetch');
                
                if (isNgrokError && window.location.hostname.includes('ngrok')) {
                    container.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center">
                                <div class="alert alert-warning m-2">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    <strong>Error de conexión con ngrok</strong><br>
                                    <small>Intenta recargar la página o verifica la conexión del túnel ngrok</small><br>
                                    <button onclick="location.reload()" class="btn btn-sm btn-warning mt-2">
                                        <i class="fas fa-redo me-1"></i>Reintentar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    container.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center text-danger">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                Error al cargar registros: ${error.message}
                            </td>
                        </tr>
                    `;
                }
            }
        }
    }, 100);
}

function showAddEmployee() {
    console.log('🔄 Mostrando modal para agregar empleado');
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
    
    // Verificar si hay entrada sin salida
    const hasOpenSession = sortedRecords.some(record => record.type === 'entry') && 
                          !sortedRecords.some(record => record.type === 'exit');
    
    // Obtener el usuario actual para verificar si es admin
    const currentUser = JSON.parse(localStorage.getItem('progressUser'));
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    // Buscar el rol del empleado para mostrar información correcta
    const employeeInfo = allEmployees ? allEmployees.find(emp => emp.name === employeeName) : null;
    const employeeRole = employeeInfo ? employeeInfo.role : 'employee';
    
    // Depuración
    console.log('🔍 Depuración de rol ban:', {
        employeeName,
        employeeRole,
        employeeInfo,
        allEmployees: allEmployees ? allEmployees.length : 0
    });
    
    // Calcular horas según el rol
    const overtimeHours = employeeRole === 'ban' ? 0 : Math.max(0, Math.floor(calculateDayMinutes(sortedRecords, employeeRole) / 60) - 9);
    const overtimeText = employeeRole === 'ban' ? 'Sin Turno Fijo' : `${overtimeHours}h`;
    const overtimeColor = employeeRole === 'ban' ? 'info' : 'warning';
    
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
                        ${employeeRole === 'ban' ? `
                            <div class="alert alert-info mb-3">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Usuario con Rol Ban</strong><br>
                                Este usuario tiene un rol "Ban" y no acumula horas extras. Solo registra entradas y salidas sin turno fijo.
                            </div>
                        ` : ''}
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h6 class="card-title">Horas Extras</h6>
                                        <h4 class="text-${overtimeColor}">${overtimeText}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <h6 class="card-title">Registros</h6>
                                        <h4 class="text-info">${sortedRecords.length}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        ${hasOpenSession && isAdmin ? `
                            <div class="alert alert-warning mb-3">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Sesión Abierta Detectada</strong><br>
                                Este empleado tiene una entrada sin salida registrada.
                                <button onclick="showAdminExitForm('${employeeName}', '${date}')" 
                                        class="btn btn-danger btn-sm ms-2">
                                    <i class="fas fa-sign-out-alt me-1"></i>Registrar Salida Administrativa
                                </button>
                            </div>
                        ` : ''}
                        
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

// Función para mostrar formulario de salida administrativa
function showAdminExitForm(employeeName, date) {
    const modalHtml = `
        <div class="modal fade" id="adminExitModal" tabindex="-1">
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
                            <strong>Empleado:</strong> ${employeeName}<br>
                            <strong>Fecha:</strong> ${new Date(date).toLocaleDateString('es-ES')}
                        </div>
                        
                        <form id="adminExitForm">
                            <div class="mb-3">
                                <label for="exitTime" class="form-label">
                                    <i class="fas fa-clock me-1"></i>
                                    Hora de Salida Exacta
                                </label>
                                <input type="time" 
                                       class="form-control" 
                                       id="exitTime" 
                                       required>
                                <small class="text-muted">
                                    Ingresa la hora exacta en la que el empleado finalizó su turno
                                </small>
                            </div>
                            
                            <div class="mb-3">
                                <label for="exitReason" class="form-label">
                                    <i class="fas fa-comment me-1"></i>
                                    Motivo de Registro Administrativo
                                </label>
                                <select class="form-control" id="exitReason" required>
                                    <option value="">Selecciona un motivo...</option>
                                    <option value="olvido_salida">Empleado olvidó registrar salida</option>
                                    <option value="problema_sistema">Problemas con el sistema</option>
                                    <option value="emergencia">Emergencia personal</option>
                                    <option value="otro">Otro motivo</option>
                                </select>
                            </div>
                            
                            <div class="mb-3" id="otherReasonDiv" style="display: none;">
                                <label for="otherReason" class="form-label">
                                    <i class="fas fa-edit me-1"></i>
                                    Especifica el motivo
                                </label>
                                <textarea class="form-control" 
                                          id="otherReason" 
                                          rows="3" 
                                          placeholder="Describe el motivo del registro administrativo..."></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label for="adminNotes" class="form-label">
                                    <i class="fas fa-sticky-note me-1"></i>
                                    Notas Adicionales (Opcional)
                                </label>
                                <textarea class="form-control" 
                                          id="adminNotes" 
                                          rows="2" 
                                          placeholder="Notas adicionales sobre este registro..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="registerAdminExit('${employeeName}', '${date}')">
                            <i class="fas fa-sign-out-alt me-2"></i>Registrar Salida
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal anterior si existe
    const existingModal = document.getElementById('adminExitModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('adminExitModal'));
    modal.show();
    
    // Manejar cambio en el selector de motivo
    document.getElementById('exitReason').addEventListener('change', function() {
        const otherReasonDiv = document.getElementById('otherReasonDiv');
        if (this.value === 'otro') {
            otherReasonDiv.style.display = 'block';
            document.getElementById('otherReason').required = true;
        } else {
            otherReasonDiv.style.display = 'none';
            document.getElementById('otherReason').required = false;
            document.getElementById('otherReason').value = '';
        }
    });
    
    // Limpiar modal al cerrar
    document.getElementById('adminExitModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
        // Reabrir modal de detalles
        showEmployeeDayDetails(employeeName, date);
    });
}

// Función para mostrar selección de empleado para salida administrativa
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
                                    <small class="text-muted">
                                        Selecciona la fecha en la que el empleado finalizó su turno
                                    </small>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="exitTime" class="form-label">
                                        <i class="fas fa-clock me-1"></i>
                                        Hora de Salida Exacta
                                    </label>
                                    <input type="time" 
                                           class="form-control" 
                                           id="exitTime" 
                                           required>
                                    <small class="text-muted">
                                        Ingresa la hora exacta en la que el empleado finalizó su turno
                                    </small>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="exitReason" class="form-label">
                                        <i class="fas fa-comment me-1"></i>
                                        Motivo de Registro Administrativo
                                    </label>
                                    <select class="form-control" id="exitReason" required>
                                        <option value="">Selecciona un motivo...</option>
                                        <option value="olvido_salida">Empleado olvidó registrar salida</option>
                                        <option value="problema_sistema">Problemas con el sistema</option>
                                        <option value="emergencia">Emergencia personal</option>
                                        <option value="otro">Otro motivo</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3" id="otherReasonDiv" style="display: none;">
                                    <label for="otherReason" class="form-label">
                                        <i class="fas fa-edit me-1"></i>
                                        Especifica el motivo
                                    </label>
                                    <textarea class="form-control" 
                                              id="otherReason" 
                                              rows="3" 
                                              placeholder="Describe el motivo del registro administrativo..."></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="adminNotes" class="form-label">
                                        <i class="fas fa-sticky-note me-1"></i>
                                        Notas Adicionales (Opcional)
                                    </label>
                                    <textarea class="form-control" 
                                              id="adminNotes" 
                                              rows="2" 
                                              placeholder="Notas adicionales sobre este registro..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="registerAdminExitFromSelection()">
                                <i class="fas fa-sign-out-alt me-2"></i>Registrar Salida
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal anterior si existe
        const existingModal = document.getElementById('adminExitSelectionModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar nuevo modal al body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('adminExitSelectionModal'));
        modal.show();
        
        // Manejar cambio en el selector de motivo
        document.getElementById('exitReason').addEventListener('change', function() {
            const otherReasonDiv = document.getElementById('otherReasonDiv');
            if (this.value === 'otro') {
                otherReasonDiv.style.display = 'block';
                document.getElementById('otherReason').required = true;
            } else {
                otherReasonDiv.style.display = 'none';
                document.getElementById('otherReason').required = false;
                document.getElementById('otherReason').value = '';
            }
        });
        
        // Limpiar modal al cerrar
        document.getElementById('adminExitSelectionModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
    })
    .catch(error => {
        console.error('Error cargando empleados:', error);
        showCustomAlert('❌ Error', 'No se pudo cargar la lista de empleados', 'danger');
    });
}

// Función para registrar salida administrativa desde la selección
async function registerAdminExitFromSelection() {
    const employeeName = document.getElementById('employeeSelect').value;
    const exitDate = document.getElementById('exitDate').value;
    const exitTime = document.getElementById('exitTime').value;
    const exitReason = document.getElementById('exitReason').value;
    const otherReason = document.getElementById('otherReason').value;
    const adminNotes = document.getElementById('adminNotes').value;
    
    // Validar campos
    if (!employeeName || !exitDate || !exitTime || !exitReason) {
        showCustomAlert('❌ Error', 'Por favor completa todos los campos obligatorios', 'danger');
        return;
    }
    
    if (exitReason === 'otro' && !otherReason) {
        showCustomAlert('❌ Error', 'Por favor especifica el motivo', 'danger');
        return;
    }
    
    // Crear timestamp completo con la hora y fecha especificadas
    const exitDateTime = new Date(`${exitDate}T${exitTime}`);
    
    // Obtener el usuario actual
    const currentUser = JSON.parse(localStorage.getItem('progressUser'));
    
    // Mostrar loading
    const registerButton = document.querySelector('button[onclick="registerAdminExitFromSelection()"]');
    const originalText = registerButton.innerHTML;
    registerButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Registrando...';
    registerButton.disabled = true;
    
    try {
        console.log('🚀 Enviando solicitud de salida administrativa:', {
            employee_name: employeeName,
            type: 'exit',
            timestamp: exitDateTime.toISOString(),
            admin_registered: true,
            admin_id: currentUser.id,
            admin_name: currentUser.name,
            exit_reason: exitReason,
            other_reason: otherReason || null,
            admin_notes: adminNotes || null,
            latitude: null,
            longitude: null,
            photo_path: null
        });
        
        // Intentar conectar con el servidor
        const response = await fetch(`${API_BASE}/admin/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: JSON.stringify({
                employee_name: employeeName,
                type: 'exit',
                timestamp: exitDateTime.toISOString(),
                admin_registered: true,
                admin_id: currentUser.id,
                admin_name: currentUser.name,
                exit_reason: exitReason,
                other_reason: otherReason || null,
                admin_notes: adminNotes || null,
                latitude: null,
                longitude: null,
                photo_path: null
            })
        });
        
        console.log('📡 Respuesta del servidor:', response.status, response.statusText);
        
        // Si el servidor no responde, guardar localmente
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            
            // Guardar localmente como fallback
            const localRecord = {
                employee_name: employeeName,
                type: 'exit',
                timestamp: exitDateTime.toISOString(),
                admin_registered: true,
                admin_id: currentUser.id,
                admin_name: currentUser.name,
                exit_reason: exitReason,
                other_reason: otherReason || null,
                admin_notes: adminNotes || null,
                latitude: null,
                longitude: null,
                photo_path: null,
                local_save: true,
                save_time: new Date().toISOString()
            };
            
            // Guardar en localStorage
            const localRecords = JSON.parse(localStorage.getItem('localAdminRecords') || '[]');
            localRecords.push(localRecord);
            localStorage.setItem('localAdminRecords', JSON.stringify(localRecords));
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('adminExitSelectionModal')).hide();
            
            // Mostrar advertencia pero con éxito
            showCustomAlert(
                '⚠️ Salida Registrada Localmente', 
                `Se ha registrado la salida de ${employeeName} para las ${exitTime} del ${new Date(exitDate).toLocaleDateString('es-ES')}.\n\n⚠️ El servidor no está disponible, pero el registro se ha guardado localmente y se sincronizará cuando el servidor esté en línea.\n\nRegistrado por: ${currentUser.name}`, 
                'warning'
            );
            
            return;
        }
        
        const data = await response.json();
        console.log('📋 Datos recibidos:', data);
        
        // Cerrar modal de selección
        bootstrap.Modal.getInstance(document.getElementById('adminExitSelectionModal')).hide();
        
        // Mostrar éxito
        showCustomAlert(
            '✅ Salida Registrada', 
            `Se ha registrado la salida de ${employeeName} para las ${exitTime} del ${new Date(exitDate).toLocaleDateString('es-ES')}.\n\nEste registro fue creado administrativamente por ${currentUser.name}.`, 
            'success'
        );
        
        // Recargar datos
        if (typeof loadAllAttendance === 'function') {
            loadAllAttendance();
        }
        
    } catch (error) {
        console.error('🚨 Error de conexión:', error);
        
        // Guardar localmente como fallback
        const localRecord = {
            employee_name: employeeName,
            type: 'exit',
            timestamp: exitDateTime.toISOString(),
            admin_registered: true,
            admin_id: currentUser.id,
            admin_name: currentUser.name,
            exit_reason: exitReason,
            other_reason: otherReason || null,
            admin_notes: adminNotes || null,
            latitude: null,
            longitude: null,
            photo_path: null,
            local_save: true,
            save_time: new Date().toISOString(),
            error: error.message
        };
        
        // Guardar en localStorage
        const localRecords = JSON.parse(localStorage.getItem('localAdminRecords') || '[]');
        localRecords.push(localRecord);
        localStorage.setItem('localAdminRecords', JSON.stringify(localRecords));
        
        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('adminExitSelectionModal')).hide();
        
        // Mostrar advertencia pero con éxito local
        showCustomAlert(
            '⚠️ Salida Registrada Localmente', 
            `Se ha registrado la salida de ${employeeName} para las ${exitTime} del ${new Date(exitDate).toLocaleDateString('es-ES')}.\n\n⚠️ El servidor no está disponible, pero el registro se ha guardado localmente y se sincronizará cuando el servidor esté en línea.\n\nRegistrado por: ${currentUser.name}\n\nError: ${error.message}`, 
            'warning'
        );
    } finally {
        // Restaurar botón
        registerButton.innerHTML = originalText;
        registerButton.disabled = false;
    }
}

function calculateDayMinutes(records, employeeRole = 'employee') {
    // Si el rol es 'ban', no acumular horas extras
    if (employeeRole === 'ban') {
        return 0; // Usuarios ban no acumulan minutos
    }
    
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

function calculateDayTotal(records, employeeRole = 'employee') {
    const totalMinutes = calculateDayMinutes(records, employeeRole);
    
    // Para usuarios ban, mostrar mensaje especial
    if (employeeRole === 'ban') {
        return 'Sin Turno Fijo';
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

let allAttendanceRecords = [];
let allEmployees = [];

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
    const name = document.getElementById('employeeName').value;
    const email = document.getElementById('employeeEmail').value;
    const password = document.getElementById('employeePassword').value;
    const position = document.getElementById('employeePosition').value;
    
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

// Función para eliminar un empleado
async function deleteEmployee(employeeId, employeeName) {
    // Obtener el usuario actual para verificar si es admin
    const currentUser = JSON.parse(localStorage.getItem('progressUser'));
    
    if (currentUser.role !== 'admin') {
        alert('Solo los administradores pueden eliminar empleados');
        return;
    }
    
    // No permitir eliminar al propio admin
    if (currentUser.id === employeeId) {
        alert('No puedes eliminar tu propio usuario');
        return;
    }
    
    // Confirmar eliminación con mensaje personalizado
    if (!confirm(`⚠️ ¿Estás seguro de que quieres eliminar al empleado "${employeeName}"?\n\nEsta acción eliminará:\n• Todos sus registros de asistencia\n• Su información personal\n• No se puede deshacer`)) {
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
            showCustomAlert('✅ Empleado Eliminado', `El empleado "${employeeName}" ha sido eliminado exitosamente.\n\nTodos sus registros de asistencia también han sido eliminados.`, 'success');
            loadEmployees(); // Recargar lista de empleados
        } else {
            const data = await response.json();
            showCustomAlert('❌ Error', data.error || 'Error al eliminar el empleado', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showCustomAlert('❌ Error de Conexión', 'No se pudo eliminar el empleado. Verifica tu conexión a internet.', 'danger');
    }
}

// Función para cargar los registros de asistencia del empleado actual
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

// Función para verificar sesión abierta y configurar recordatorios
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

// Función para mostrar recordatorio de sesión abierta
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

// Función para enviar notificación del navegador
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

// Función para crear notificación
function createNotification(title, body) {
    // Reproducir sonido de notificación
    playNotificationSound();
    
    const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'session-reminder',
        requireInteraction: true,
        sound: '/notification-sound.mp3' // Sonido para navegadores que lo soporten
    });
    
    // Cerrar notificación después de 10 segundos
    setTimeout(() => {
        notification.close();
    },10000);
    
    // Redirigir al hacer clic en la notificación
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
}

// Función para reproducir sonido de notificación
function playNotificationSound() {
    try {
        // Crear audio con sonido de notificación del sistema
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+zPLTgjMGHm7A7+OZURE');
        
        // Configurar audio
        audio.volume = 1.0; // 100% de volumen
        audio.playbackRate = 1.0; // Velocidad normal
        audio.loop = true; // Repetir automáticamente
        
        // Reproducir sonido y mantenerlo sonando
        audio.play().catch(error => {
            console.log('No se pudo reproducir sonido:', error);
            // Si falla, intentar con sonido alternativo
            playAlternativeSound();
        });
        
        // Detener después de 5 segundos
        setTimeout(() => {
            if (audio && !audio.paused) {
                audio.pause();
                audio.loop = false;
            }
        }, 5000);
        
    } catch (error) {
        console.log('Error al crear audio:', error);
        playAlternativeSound();
    }
}

// Función para sonido alternativo (alarma de atención máxima)
function playAlternativeSound() {
    try {
        // Usar Web Audio API para generar una alarma de atención máxima
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Crear múltiples osciladores para un sonido rico
        const primaryOsc = audioContext.createOscillator();
        const secondaryOsc = audioContext.createOscillator();
        const tertiaryOsc = audioContext.createOscillator();
        const noiseOsc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Conectar osciladores
        primaryOsc.connect(gainNode);
        secondaryOsc.connect(gainNode);
        tertiaryOsc.connect(gainNode);
        noiseOsc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configurar oscilador principal (tono de atención)
        primaryOsc.frequency.value = 1500; // Muy agudo
        primaryOsc.type = 'square'; // Penetrante
        
        // Configurar oscilador secundario (armonía)
        secondaryOsc.frequency.value = 750; // Medio
        secondaryOsc.type = 'sawtooth'; // Rico en armónicos
        
        // Configurar oscilador terciario (bajo)
        tertiaryOsc.frequency.value = 375; // Muy bajo
        tertiaryOsc.type = 'triangle'; // Suave
        
        // Configurar ruido blanco para atención
        noiseOsc.type = 'square';
        noiseOsc.frequency.value = 2000; // Ultra agudo
        
        // Mezclar tonos con diferentes ganancias
        const primaryGain = audioContext.createGain();
        const secondaryGain = audioContext.createGain();
        const tertiaryGain = audioContext.createGain();
        const noiseGain = audioContext.createGain();
        
        primaryOsc.connect(primaryGain);
        secondaryOsc.connect(secondaryGain);
        tertiaryOsc.connect(tertiaryGain);
        noiseOsc.connect(noiseGain);
        
        primaryGain.connect(gainNode);
        secondaryGain.connect(gainNode);
        tertiaryGain.connect(gainNode);
        noiseGain.connect(gainNode);
        
        primaryGain.gain.value = 0.6; // 60% principal
        secondaryGain.gain.value = 0.3; // 30% armonía
        tertiaryGain.gain.value = 0.2; // 20% bajo
        noiseGain.gain.value = 0.1; // 10% ruido
        
        // Configurar volumen al máximo
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        
        // Crear patrón de alarma de atención máxima
        const startTime = audioContext.currentTime;
        const alarmPattern = [
            { time: 0.0, gain: 1.0 },      // Explosión inicial
            { time: 0.1, gain: 0.8 },      // Baja rápida
            { time: 0.2, gain: 1.0 },      // Segunda explosión
            { time: 0.3, gain: 0.6 },      // Baja
            { time: 0.4, gain: 1.0 },      // Tercera explosión
            { time: 0.5, gain: 0.4 },      // Baja
            { time: 0.6, gain: 0.8 },      // Cuarta explosión
            { time: 0.7, gain: 0.3 },      // Baja
            { time: 0.8, gain: 0.6 },      // Quinta explosión
            { time: 0.9, gain: 0.2 },      // Baja
            { time: 1.0, gain: 0.4 },      // Sexta explosión
            { time: 1.1, gain: 0.1 },      // Baja
            { time: 1.2, gain: 0.2 },      // Séptima explosión
            { time: 1.3, gain: 0.1 },      // Baja
            { time: 1.4, gain: 0.3 },      // Octava explosión
            { time: 1.5, gain: 0.1 },      // Baja
            { time: 1.6, gain: 0.2 },      // Novena explosión
            { time: 1.7, gain: 0.1 },      // Baja
            { time: 1.8, gain: 0.3 },      // Décima explosión
            { time: 1.9, gain: 0.1 },      // Baja
            { time: 2.0, gain: 0.2 },      // Undécima explosión
            { time: 2.1, gain: 0.1 },      // Baja
            { time: 2.2, gain: 0.3 },      // Duodécima explosión
            { time: 2.3, gain: 0.1 },      // Baja
            { time: 2.4, gain: 0.2 },      // Decimotercera explosión
            { time: 2.5, gain: 0.1 },      // Baja
            { time: 2.6, gain: 0.3 },      // Decimocuarta explosión
            { time: 2.7, gain: 0.1 },      // Baja
            { time: 2.8, gain: 0.2 },      // Decimoquinta explosión
            { time: 2.9, gain: 0.1 },      // Baja
            { time: 3.0, gain: 0.3 },      // Decimosexta explosión
            { time: 3.1, gain: 0.1 },      // Baja
            { time: 3.2, gain: 0.2 },      // Decimoséptima explosión
            { time: 3.3, gain: 0.1 },      // Baja
            { time: 3.4, gain: 0.2 },      // Decimoctava explosión
            { time: 3.5, gain: 0.1 },      // Baja
            { time: 3.6, gain: 0.2 },      // Decimonovena explosión
            { time: 3.7, gain: 0.1 },      // Baja
            { time: 3.8, gain: 0.2 },      // Vigésima explosión
            { time: 3.9, gain: 0.1 },      // Baja
            { time: 4.0, gain: 0.2 },      // Vigésimo primera explosión
            { time: 4.1, gain: 0.1 },      // Baja
            { time: 4.2, gain: 0.2 },      // Vigésimo segunda explosión
            { time: 4.3, gain: 0.1 },      // Baja
            { time: 4.4, gain: 0.2 },      // Vigésimo tercera explosión
            { time: 4.5, gain: 0.1 },      // Baja
            { time: 4.6, gain: 0.2 },      // Vigésimo cuarta explosión
            { time: 4.7, gain: 0.1 },      // Baja
            { time: 4.8, gain: 0.2 },      // Vigésimo quinta explosión
            { time: 4.9, gain: 0.1 },      // Baja
            { time: 5.0, gain: 0.0 }       // Silencio final
        ];
        
        // Programar el patrón de alarma de atención máxima
        alarmPattern.forEach(point => {
            gainNode.gain.linearRampToValueAtTime(
                point.gain, 
                startTime + point.time
            );
        });
        
        // Iniciar osciladores
        primaryOsc.start(startTime);
        secondaryOsc.start(startTime);
        tertiaryOsc.start(startTime);
        noiseOsc.start(startTime);
        
        // Detener después de 5 segundos
        primaryOsc.stop(startTime + 5.0);
        secondaryOsc.stop(startTime + 5.0);
        tertiaryOsc.stop(startTime + 5.0);
        noiseOsc.stop(startTime + 5.0);
        
    } catch (error) {
        console.log('Error en sonido alternativo:', error);
        // Último recurso: vibración de emergencia
        if ('vibrate' in navigator) {
            // Patrón de vibración de emergencia (muy intenso)
            navigator.vibrate([
                1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500,
                1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500,
                1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500
            ]);
        }
    }
}

// Función para configurar recordatorios automáticos
function setupAutomaticReminders(entryTime) {
    // Limpiar recordatorios existentes
    clearExistingReminders();
    
    const now = new Date();
    const entryHour = entryTime.getHours();
    
    // Configurar recordatorio para fin de jornada (6:00 PM)
    const endOfDayReminder = new Date(now);
    endOfDayReminder.setHours(18, 0, 0, 0);
    
    if (endOfDayReminder > now) {
        const endOfDayTimeout = endOfDayReminder - now;
        setTimeout(() => {
            sendBrowserNotification('Fin de Jornada', 'No olvides registrar tu salida');
        }, endOfDayTimeout);
    }
    
    // Configurar recordatorio tardío (8:00 PM)
    const lateReminder = new Date(now);
    lateReminder.setHours(20, 0, 0, 0);
    
    if (lateReminder > now) {
        const lateTimeout = lateReminder - now;
        setTimeout(() => {
            showCustomAlert(
                '🚨 RECORDATORIO URGENTE', 
                '¡Aún tienes tu sesión de trabajo abierta!<br><br>Por favor registra tu salida inmediatamente para evitar problemas con tus horas extras.', 
                'danger'
            );
            sendBrowserNotification('Urgente: Sesión Abierta', 'Registra tu salida ahora');
        }, lateTimeout);
    }
    
    // Configurar recordatorios periódicos (cada 60 minutos después de las 9 horas)
    const hoursSinceEntry = (now - entryTime) / (1000 * 60 * 60);
    if (hoursSinceEntry > 9) {
        setInterval(() => {
            sendBrowserNotification('Sesión Abierta', 'Recuerda registrar tu salida');
        }, 60 * 60 * 1000); // Cada 60 minutos
    }
}

// Función para limpiar recordatorios existentes
function clearExistingReminders() {
    // Limpiar timeouts y intervals existentes
    for (let i = 1; i < 99999; i++) {
        clearTimeout(i);
        clearInterval(i);
    }
}

// Función para solicitar permiso de notificaciones al cargar la página
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Permiso de notificaciones concedido");
                showCustomAlert('✅ Notificaciones Activadas', 'Recibirás recordatorios para registrar tu salida', 'success');
            }
        });
    }
}

// Solicitar permiso de notificaciones después del login
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('progressToken');
    if (token) {
        const user = JSON.parse(localStorage.getItem('progressUser'));
        loginSuccess(user, token);
        
        // Solicitar permiso de notificaciones
        setTimeout(() => {
            requestNotificationPermission();
        }, 2000);
    }
});

// Función para emular notificación
function emulateNotification() {
    console.log('🚀 Iniciando emulación de notificación...');
    
    // Mostrar diferentes tipos de notificaciones
    const notificationTypes = [
        {
            title: '⏰ SESIÓN ABIERTA DETECTADA',
            message: 'Parece que tienes una sesión de trabajo abierta.<br><br>Por favor registra tu salida para evitar errores en el cálculo de horas extras.',
            type: 'warning',
            browserTitle: 'Sesión Abierta',
            browserMessage: 'Registra tu salida para evitar errores en horas extras'
        },
        {
            title: '🚨 RECORDATORIO URGENTE',
            message: '¡Aún tienes tu sesión de trabajo abierta!<br><br>Por favor registra tu salida inmediatamente para evitar problemas con tus horas extras.',
            type: 'danger',
            browserTitle: 'Urgente: Sesión Abierta',
            browserMessage: 'Registra tu salida ahora'
        },
        {
            title: '✅ Notificaciones Activadas',
            message: 'Recibirás recordatorios para registrar tu salida',
            type: 'success',
            browserTitle: 'Notificaciones Listas',
            browserMessage: 'Sistema de notificaciones activado'
        }
    ];
    
    // Seleccionar una notificación aleatoria
    const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    
    // Mostrar alerta personalizada
    showCustomAlert(
        randomNotification.title,
        randomNotification.message,
        randomNotification.type
    );
    
    // Enviar notificación del navegador
    sendBrowserNotification(
        randomNotification.browserTitle,
        randomNotification.browserMessage
    );
    
    console.log('📱 Notificación emulada:', randomNotification.title);
}

// Función para mostrar el modal de cambiar contraseña
function showChangePassword() {
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
    
    // Limpiar formulario
    document.getElementById('changePasswordForm').reset();
}

// Función para mostrar el modal de olvidé contraseña
function showForgotPassword() {
    const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
    modal.show();
    
    // Limpiar formulario
    document.getElementById('forgotPasswordForm').reset();
}

// Función para cambiar contraseña
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const securityQuestion = document.getElementById('securityQuestion').value;
    const securityAnswer = document.getElementById('securityAnswer').value;
    
    console.log('Datos del formulario:', {
        currentPassword: currentPassword ? '***' : undefined,
        newPassword: newPassword ? '***' : undefined,
        confirmPassword: confirmPassword ? '***' : undefined,
        securityQuestion,
        securityAnswer
    });
    
    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword || !securityQuestion || !securityAnswer) {
        console.log('Error: Campos faltantes');
        showCustomAlert('Error', 'Por favor completa todos los campos', 'danger');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        console.log('Error: Contraseñas no coinciden');
        showCustomAlert('Error', 'Las contraseñas nuevas no coinciden', 'danger');
        return;
    }
    
    if (newPassword.length < 6) {
        console.log('Error: Contraseña muy corta');
        showCustomAlert('Error', 'La nueva contraseña debe tener al menos 6 caracteres', 'danger');
        return;
    }
    
    try {
        console.log('Enviando solicitud de cambio de contraseña...');
        const response = await fetch(`${API_BASE}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('progressToken')}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
                securityQuestion,
                securityAnswer
            })
        });
        
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (response.ok) {
            showCustomAlert('Éxito', 'Contraseña cambiada exitosamente', 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
            
            // Limpiar formulario
            document.getElementById('changePasswordForm').reset();
        } else {
            console.log('Error en respuesta:', data.error);
            showCustomAlert('Error', data.error || 'Error al cambiar la contraseña', 'danger');
        }
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        showCustomAlert('Error', 'Error de conexión. Intenta nuevamente', 'danger');
    }
}

// Función para recuperar contraseña
async function resetPassword() {
    const email = document.getElementById('forgotEmail').value;
    const securityQuestion = document.getElementById('forgotSecurityQuestion').value;
    const securityAnswer = document.getElementById('forgotSecurityAnswer').value;
    const newPassword = document.getElementById('newPasswordReset').value;
    const confirmPassword = document.getElementById('confirmPasswordReset').value;
    
    // Validaciones
    if (!email || !securityQuestion || !securityAnswer || !newPassword || !confirmPassword) {
        showCustomAlert('Error', 'Por favor completa todos los campos', 'danger');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showCustomAlert('Error', 'Las contraseñas nuevas no coinciden', 'danger');
        return;
    }
    
    if (newPassword.length < 6) {
        showCustomAlert('Error', 'La nueva contraseña debe tener al menos 6 caracteres', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                securityQuestion,
                securityAnswer,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showCustomAlert('Éxito', 'Contraseña restablecida exitosamente. Ahora puedes iniciar sesión', 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
            modal.hide();
            
            // Limpiar formulario
            document.getElementById('forgotPasswordForm').reset();
        } else {
            showCustomAlert('Error', data.error || 'Error al restablecer la contraseña', 'danger');
        }
    } catch (error) {
        console.error('Error restableciendo contraseña:', error);
        showCustomAlert('Error', 'Error de conexión. Intenta nuevamente', 'danger');
    }
}

// Funciones para vista previa de Google Maps
let mapPreviewTimeout;

function showMapPreview(element, latitude, longitude) {
    // Limpiar timeout existente
    if (mapPreviewTimeout) {
        clearTimeout(mapPreviewTimeout);
    }
    
    // Esperar un momento antes de mostrar la vista previa
    mapPreviewTimeout = setTimeout(() => {
        createMapPreview(element, latitude, longitude);
    }, 500);
}

function hideMapPreview(element) {
    // Limpiar timeout
    if (mapPreviewTimeout) {
        clearTimeout(mapPreviewTimeout);
    }
    
    // Eliminar vista previa existente
    const existingPreview = document.getElementById('map-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
}

function createMapPreview(element, latitude, longitude) {
    // Eliminar vista previa existente
    const existingPreview = document.getElementById('map-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    // Crear contenedor para la vista previa
    const previewContainer = document.createElement('div');
    previewContainer.id = 'map-preview';
    previewContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        background: white;
        border: 2px solid #00d4ff;
        border-radius: 8px;
        padding: 8px;
        box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
        margin-top: 5px;
        min-width: 300px;
        max-width: 400px;
    `;
    
    // Crear imagen del mapa estático
    const mapImage = document.createElement('img');
    mapImage.src = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=300x200&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`;
    mapImage.alt = 'Vista previa del mapa';
    mapImage.style.cssText = `
        width: 100%;
        height: 200px;
        border-radius: 4px;
        display: block;
    `;
    
    // Crear información de coordenadas
    const coordsInfo = document.createElement('div');
    coordsInfo.innerHTML = `
        <div style="font-size: 12px; color: #333; margin-top: 8px; text-align: center;">
            <strong>Coordenadas:</strong><br>
            Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}
        </div>
    `;
    
    // Agregar elementos al contenedor
    previewContainer.appendChild(mapImage);
    previewContainer.appendChild(coordsInfo);
    
    // Posicionar el contenedor relativo al elemento
    const rect = element.getBoundingClientRect();
    previewContainer.style.position = 'fixed';
    previewContainer.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    previewContainer.style.left = (rect.left + window.scrollX) + 'px';
    
    // Agregar al body
    document.body.appendChild(previewContainer);
    
    // Cerrar automáticamente después de 10 segundos
    setTimeout(() => {
        if (document.getElementById('map-preview')) {
            document.getElementById('map-preview').remove();
        }
    }, 10000);
}

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
                                        <img src="/uploads/${record.photo_path}" 
                                             alt="Foto del registro" 
                                             class="img-fluid rounded"
                                             style="max-height: 200px; border: 2px solid var(--progress-teal);">
                                        <div class="mt-2">
                                            <a href="/uploads/${record.photo_path}" 
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

// Función para cargar mapa con OpenStreetMap (no requiere API key)
function loadOpenStreetMap(latitude, longitude, recordId) {
    const mapContainer = document.getElementById(`record-map-${recordId}`);
    if (!mapContainer) return;
    
    // Crear iframe con OpenStreetMap
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '250px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '4px';
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.002},${latitude - 0.002},${longitude + 0.002},${latitude + 0.002}&layer=mapnik&marker=${latitude},${longitude}`;
    
    // Reemplazar el contenido del contenedor
    mapContainer.innerHTML = '';
    mapContainer.appendChild(iframe);
    
    console.log(`🗺️ Mapa cargado para coordenadas: ${latitude}, ${longitude}`);
}

// Asegurar que loadAllAttendance esté disponible globalmente
window.loadAllAttendance = loadAllAttendance;
window.loadAllAttendanceImpl = loadAllAttendanceImpl;
console.log('✅ loadAllAttendance y loadAllAttendanceImpl registradas globalmente');
