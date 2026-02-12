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
- **⚫ Ban** - Registro sin acumulación de horas extras

### � **Panel de Administración Completo**
- **Gestión de empleados** - Crear, editar, eliminar usuarios
- **Cambio de roles** - Sistema flexible de asignación de permisos
- **Registros detallados** - Historial completo con filtros
- **Horas extras automáticas** - Cálculo inteligente de tiempo extra
- **Salidas administrativas** - Registro manual de salidas olvidadas

### 🔄 **Sistema de Sincronización**
- **Guardado local** - Funciona sin conexión a internet
- **Sincronización automática** - Cuando el servidor vuelve a estar disponible
- **Notificaciones push** - Alertas de asistencia y recordatorios
- **Respaldo automático** - Protección contra pérdida de datos

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
   
   Para desarrollo:
   ```bash
   npm run dev
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

### ⚫ **Ban**
- **Email:** `ban@progress.com`
- **Contraseña:** `ban123`
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

### 📊 **Análisis de Datos**
1. **Horas extras** - Cálculo automático sobre 9 horas diarias
2. **Reportes diarios** - Resumen por empleado y día
3. **Historial completo** - Todos los registros con ubicación y foto
4. **Exportación** - Datos listos para análisis externo

## 🔧 Configuración Avanzada

### 🌐 **Configuración de Red**
- **Puerto:** 3000 (configurable en variables de entorno)
- **Base de datos:** SQLite (archivo progress.db)
- **Archivos estáticos:** Carpeta `public/`
- **Logs:** Consola del servidor

### 📱 **Configuración Móvil**
- **PWA:** Instalable como aplicación nativa
- **Notificaciones:** Push notifications soportadas
- **GPS:** Precisión de 10 metros
- **Cámara:** Resolución automática óptima

### 🔒 **Seguridad**
- **JWT Tokens** - Autenticación segura con expiración
- **bcrypt** - Encriptación de contraseñas
- **CORS** - Configuración segura de dominios
- **Input validation** - Validación estricta de datos

## 🚀 Despliegue en Producción

### 🐳 **Docker (Recomendado)**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 🌐 **Producción con PM2**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start server-simple.js --name "progress-assistance"

# Ver estado
pm2 status

# Ver logs
pm2 logs progress-assistance
```

### 🔧 **Variables de Entorno**
```bash
# .env
NODE_ENV=production
PORT=3000
DB_PATH=./progress.db
JWT_SECRET=tu-secreto-aqui
```

## 📊 Monitoreo y Mantenimiento

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
- **Documentación:** Wiki del proyecto
- **Issues:** GitHub Issues
- **Email:** soporte@progress.com
- **Chat:** Discord/Slack del equipo

## 📜 **Historial de Cambios**

### v2.0.0 (Actual)
- ✅ Rol Coordinador implementado
- ✅ Rol Ban con sin horas extras
- ✅ Cambio de roles con justificación
- ✅ Salidas administrativas con fallback local
- ✅ Interfaz mejorada y responsiva
- ✅ Sistema de sincronización robusto

### v1.0.0
- ✅ Sistema básico de asistencia
- ✅ Registro fotográfico y GPS
- ✅ Panel de administración
- ✅ Autenticación JWT

---

**🚀 Progress Net - Sistema de Asistencia Profesional**

*Desarrollado con ❤️ para equipos modernos*
6. **Ver historial** - Sus registros del día se muestran automáticamente

### Para Administradores

1. **Iniciar sesión** con credenciales de administrador
2. **Gestionar empleados** - Agregue nuevos empleados al sistema
3. **Ver todos los registros** - Acceda al historial completo de asistencia
4. **Monitorear en tiempo real** - Vea las entradas y salidas según ocurren

## Requisitos Técnicos

- **Node.js** (versión 14 o superior)
- **Navegador moderno** con soporte para:
  - Geolocalización GPS
  - Acceso a cámara web
  - JavaScript ES6+

## Estructura del Proyecto

```
progress-assistance-system/
├── server.js              # Servidor backend con Express
├── package.json           # Dependencias del proyecto
├── progress_assistance.db # Base de datos SQLite (se crea automáticamente)
├── uploads/               # Carpeta para fotos de asistencia
└── public/               # Archivos frontend
    ├── index.html        # Página principal
    ├── app.js           # Lógica JavaScript
    └── style.css        # Estilos (incluido en HTML)
```

## API Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión

### Empleados
- `POST /api/attendance` - Registrar asistencia (con foto y ubicación)
- `GET /api/attendance` - Obtener registros del empleado actual

### Administración
- `GET /api/admin/employees` - Listar todos los empleados
- `POST /api/admin/employees` - Crear nuevo empleado
- `GET /api/admin/attendance` - Obtener todos los registros de asistencia

## Seguridad

- **Contraseñas encriptadas** con bcrypt
- **Tokens JWT** para autenticación
- **Validación de permisos** para acciones administrativas
- **Almacenamiento seguro** de imágenes en servidor local

## Soporte Móvil

La aplicación está optimizada para funcionar en dispositivos móviles:

- **Diseño responsivo** que se adapta a cualquier pantalla
- **Botones grandes** para fácil acceso con dedos
- **Interfaz táctil** optimizada
- **Compatibilidad** con navegadores móviles modernos

## Notas Importantes

1. **Permisos del navegador:** Los usuarios deben permitir acceso a cámara y geolocalización
2. **Conexión a internet:** Requerida para geolocalización GPS
3. **HTTPS recomendado:** Para producción, use HTTPS para mejor seguridad y compatibilidad móvil
4. **Respaldo:** Realice copias de seguridad regulares de la base de datos `progress_assistance.db`

## Personalización

- **Branding:** Cambie los colores y logo en el CSS (variables `--progress-blue`, etc.)
- **Notificaciones:** Puede agregar notificaciones push para registros
- **Reportes:** Exporte datos a Excel/PDF desde el panel de administración
- **Integración:** Conecte con sistemas de nómina existentes

## Licencia

MIT License - Libre para uso comercial y personal
