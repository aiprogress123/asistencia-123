# Despliegue en Vercel - Progress Assistance System

## 📋 Requisitos
- Node.js instalado
- Cuenta en Vercel (https://vercel.com)
- Git instalado

## 🚀 Pasos para desplegar

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Iniciar sesión en Vercel
```bash
vercel login
```

### 3. Desplegar el proyecto
```bash
vercel
```

### 4. Configurar variables de entorno (si es necesario)
En Vercel Dashboard > Settings > Environment Variables:
- `NODE_ENV`: production

## 📁 Estructura del proyecto
```
progress-assistance-system/
├── server.js              # Servidor Node.js
├── package.json           # Dependencias
├── vercel.json           # Configuración de Vercel
├── public/               # Archivos estáticos
│   ├── index.html
│   ├── app.js
│   └── uploads/
└── progress_net_assistance.db  # Base de datos
```

## 🔧 Configuración de Vercel
El archivo `vercel.json` ya está configurado para:
- Servir archivos estáticos desde `public/`
- Manejar rutas API con `server.js`
- Configurar entorno de producción

## 🌐 URL del despliegue
Una vez desplegado, Vercel te asignará una URL como:
- `https://progress-assistance-system.vercel.app`

## 📝 Notas importantes
- La base de datos SQLite no funciona en Vercel (necesitarás PostgreSQL)
- Para producción, considera migrar a una base de datos en la nube
- Los archivos subidos se guardan temporalmente

## 🔄 Despliegue automático
Cada vez que hagas push a tu repositorio Git, Vercel desplegará automáticamente.
