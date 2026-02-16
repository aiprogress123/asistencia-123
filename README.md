# Progress - Sistema de Control de Asistencia

Sistema web de control de asistencia para empleados con registro fotográfico y geolocalización en tiempo real.

## 🚀 Características Principales

### 📱 **Interfaz Multiplataforma**
- **Diseño responsivo** - Optimizado para móviles, tablets y desktop
- **Interfaz intuitiva** - Fácil de usar para todos los niveles
- **Modo oscuro/claro** - Diseño moderno y profesional

### 📸 **Sistema de Registro Avanzado**
- **Captura fotográfica** - Foto obligatoria en cada registro
- **Geolocalización GPS** - Coordenadas exactas con Google Maps
- **Timestamp preciso** - Fecha y hora exacta en zona horaria local
- **Validación en tiempo real** - Verificación instantánea de datos

### 🔐 **Sistema de Roles y Permisos**
- **🔴 Administrador** - Control total del sistema
- **🟡 Coordinador** - Vista completa sin permisos de edición
- **🔵 Empleado** - Registro normal de asistencia
- **⚫ Van** - Registro sin acumulación de horas extras

### 🔄 **Panel de Administración Completo**
- **Gestión de empleados** - Crear, editar, eliminar usuarios
- **Cambio de roles** - Sistema flexible de asignación de permisos
- **Registros detallados** - Historial completo con filtros
- **Horas extras automáticas** - Cálculo inteligente de tiempo extra
- **Salidas administrativas** - Registro manual de salidas olvidadas

## 🛠️ Instalación y Configuración

### 📋 Requisitos del Sistema
- **Node.js 16+** - Runtime de JavaScript
- **SQLite3** - Base de datos ligera
- **Navegador moderno** - Chrome, Firefox, Safari, Edge
- **Cámara y GPS** - Permisos de hardware del dispositivo

### 🚀 Instalación Rápida

1. **Clonar el repositorio:**
   ```bash
   git clone <repository-url>
   cd progress-assistance-system
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor:**
   ```bash
   npm start
   ```

4. **Acceder a la aplicación:**
   - **Local:** `http://localhost:3000`
   - **Red:** `http://[IP-SERVIDOR]:3000`
   - **Móvil:** Use la IP del servidor en la misma red

## 👥 Usuarios y Roles

### 🔴 **Administrador**
- **Email:** `admin@progress.com`
- **Contraseña:** `admin123`
- **Permisos:** Control total del sistema
- **Funciones:** 
  - Crear, editar, eliminar empleados
  - Cambiar roles de usuarios
  - Ver todos los registros
  - Registrar salidas administrativas
  - Configuración del sistema

### 🟡 **Coordinador**
- **Email:** `coordinador@progress.com`
- **Contraseña:** `coord123`
- **Permisos:** Solo lectura y visualización
- **Funciones:**
  - Ver lista de empleados
  - Ver todos los registros de asistencia
  - Calcular horas extras
  - Analizar datos de asistencia
  - **No puede:** Crear, editar o eliminar empleados

### 🔵 **Empleado**
- **Permisos:** Registro de asistencia personal
- **Funciones:**
  - Registrar entrada y salida
  - Ver sus propios registros
  - Calcular sus horas extras
  - Ver su historial

### ⚫ **Van**
- **Permisos:** Registro sin acumulación
- **Funciones:**
  - Registrar entrada y salida normal
  - **No acumula horas extras**
  - Ideal para personal temporal o voluntarios

## 📱 Guía de Uso

### 🔑 **Inicio de Sesión**
1. **Abrir navegador** - Ir a la URL del sistema
2. **Ingresar credenciales** - Email y contraseña asignadas
3. **Seleccionar perfil** - El sistema detecta automáticamente el rol

### 📸 **Registro de Asistencia (Empleados)**
1. **Activar cámara** - Click en "Activar Cámara"
2. **Permitir acceso** - Aceptar permisos del navegador
3. **Verificar ubicación** - GPS se obtiene automáticamente
4. **Registrar entrada** - Click en "Registrar Entrada" al llegar
5. **Registrar salida** - Click en "Registrar Salida" al terminar

### 👥 **Panel de Administración**
1. **Ver empleados** - Lista completa con roles y estado
2. **Gestionar usuarios** - Agregar, editar, eliminar
3. **Cambiar roles** - Promover o cambiar permisos
4. **Ver registros** - Historial completo con filtros
5. **Registrar salidas administrativas** - Corregir olvidos

## 📊 **Análisis de Datos**

1. **Horas extras** - Cálculo automático sobre 9 horas diarias
2. **Reportes diarios** - Resumen por empleado y día
3. **Historial completo** - Todos los registros con ubicación y foto
4. **Exportación** - Datos listos para análisis externo

## 🔧 **Configuración Local**

### 🌐 **Configuración de Red**
- **Puerto:** 3000 (configurable en variables de entorno)
- **Base de datos:** SQLite (archivo progress_net_assistance.database)
- **Archivos estáticos:** Carpeta `public/`
- **Logs:** Consola del servidor

### 📱 **Configuración Móvil**
- **PWA:** Instalable como aplicación nativa
- **Notificaciones:** Push notifications soportadas
- **GPS:** Precisión de 10 metros
- **Cámara:** Resolución automática óptima

## 🔒 **Seguridad**

- **JWT Tokens** - Autenticación segura con expiración
- **bcrypt** - Encriptación de contraseñas
- **CORS** - Configuración segura de dominios
- **Input validation** - Validación estricta de datos

## 📈 **Monitoreo y Mantenimiento**

### 📈 **Métricas Clave**
- **Usuarios activos** - Sesiones concurrentes
- **Registros diarios** - Volumen de uso
- **Horas extras** - Costos laborales
- **Ubicaciones** - Cobertura geográfica

### 🔧 **Mantenimiento Programado**
- **Limpieza de logs** - Rotación semanal
- **Respaldo de BD** - Copia diaria automática
- **Actualización de sistema** - Despliegue sin downtime
- **Monitoreo de salud** - Verificación 24/7

## 🆘 **Soporte y Troubleshooting**

### 🔧 **Problemas Comunes**
- **Cámara no funciona:** Verificar permisos del navegador
- **GPS no detecta:** Habilitar ubicación en configuración
- **No se conecta:** Verificar firewall y red
- **Horas incorrectas:** Revisar zona horaria del sistema

### 📞 **Contacto de Soporte**
- **Documentación:** README.md del proyecto
- **Issues:** GitHub Issues
- **Email:** soporte@progress.com

---

**Desarrollado para uso local con Node.js y SQLite**
