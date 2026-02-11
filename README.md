# Progress - Sistema de Control de Asistencia

Sistema web de control de asistencia para empleados con registro fotográfico y geolocalización en tiempo real.

## Características

- 📱 **Interfaz móvil optimizada** - Diseño responsivo para celulares
- 📸 **Registro fotográfico** - Captura de foto al momento de registrar entrada/salida
- 📍 **Geolocalización en tiempo real** - Registro automático de ubicación GPS
- 🔐 **Sistema de autenticación** - Login seguro para empleados y administradores
- 👥 **Panel de administración** - Gestión de empleados y visualización de registros
- 💾 **Base de datos local** - Almacenamiento seguro de toda la información
- 🎨 **Diseño moderno** - Interfaz intuitiva y profesional

## Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor:**
   ```bash
   npm start
   ```
   
   Para desarrollo:
   ```bash
   npm run dev
   ```

3. **Acceder a la aplicación:**
   - Abra su navegador y vaya a `http://localhost:3000`
   - Desde dispositivos móviles, use la IP del servidor en la misma red

## Credenciales por Defecto

**Administrador:**
- Email: `admin@progress.com`
- Contraseña: `admin123`

## Uso

### Para Empleados

1. **Iniciar sesión** con sus credenciales proporcionadas por el administrador
2. **Activar cámara** - Haga clic en "Activar Cámara" y permita el acceso
3. **Obtener ubicación** - El sistema obtiene automáticamente su ubicación GPS
4. **Registrar entrada** - Al llegar al trabajo, haga clic en "Registrar Entrada"
5. **Registrar salida** - Al terminar su jornada, haga clic en "Registrar Salida"
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
