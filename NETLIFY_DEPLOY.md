# Despliegue en Netlify - Progress Assistance System

## 🚀 Configuración Completa para Netlify

### 📋 Requisitos Previos

1. **Cuenta en Netlify** - https://app.netlify.com/
2. **Backend desplegado** - En Railway, Render, o Vercel
3. **URL del backend** - Ej: https://tu-backend.railway.app

### 🔧 Configuración del Frontend

#### 1. Archivos de Configuración Creados

✅ **netlify.toml** - Configuración de build y redirects
✅ **public/_redirects** - Redirecciones de API
✅ **app.js** - API_BASE dinámico para Netlify

#### 2. Variables de Entorno en Netlify

En Netlify Dashboard → Site settings → Build & deploy → Environment:

```
NODE_VERSION = 18
API_URL = https://tu-backend-url.com
```

### 🌐 Despliegue Paso a Paso

#### Opción 1: Drag & Drop (Más Fácil)

1. **Comprimir la carpeta `public`**
   ```bash
   # En Windows
   cd public
   tar -czf ../netlify-deploy.tar.gz *
   
   # O comprimir manualmente en explorador
   ```

2. **Arrastrar a Netlify**
   - Ve a https://app.netlify.com/drop
   - Arrastra el archivo comprimido
   - Espera el despliegue

#### Opción 2: Git Integration

1. **Subir a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Ready for Netlify deploy"
   git push origin main
   ```

2. **Conectar Netlify**
   - New site from Git → GitHub
   - Selecciona tu repositorio
   - Build settings: por defecto
   - Deploy!

### 🔗 Configuración del Backend URL

**IMPORTANTE:** Reemplaza `https://tu-servidor-backend.com` con tu URL real:

1. **En `netlify.toml`:**
   ```toml
   [[redirects]]
   from = "/api/*"
   to = "https://TU-BACKEND-URL.com/api/:splat"
   ```

2. **En `public/_redirects`:**
   ```
   /api/*  https://TU-BACKEND-URL.com/api/:splat  200
   ```

3. **En `app.js`:**
   ```javascript
   return 'https://TU-BACKEND-URL.com/api';
   ```

### 🎯 Backend Options

#### Opción A: Railway (Recomendado)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y desplegar
railway login
railway init
railway up
```

#### Opción B: Render
- Sube tu `server.js` a Render
- Obtén la URL: https://tu-app.onrender.com

#### Opción C: Vercel Serverless
- Convierte `server.js` a funciones serverless
- Despliega en Vercel

### ✅ Verificación del Despliegue

1. **Frontend en Netlify:**
   - URL: https://tu-nombre.netlify.app
   - Debería mostrar el login

2. **Backend funcionando:**
   - Test: https://tu-backend-url.com/api/health
   - Debería responder: `{"status":"healthy"}`

3. **Conexión completa:**
   - Login con `admin@progress.com`
   - Debería funcionar completamente

### 🚨 Problemas Comunes y Soluciones

#### Error: "No se puede conectar al servidor"
- **Causa:** URL del backend incorrecta
- **Solución:** Verifica todas las URLs en los archivos de configuración

#### Error: "CORS policy error"
- **Causa:** Backend no permite tu dominio Netlify
- **Solución:** Agrega tu URL Netlify a los CORS del backend

#### Error: "API 404 Not Found"
- **Causa:** Redirecciones incorrectas
- **Solución:** Verifica `_redirects` y `netlify.toml`

### 📱 Características en Netlify

✅ **HTTPS automático**
✅ **CDN global**
✅ **Despliegue continuo**
✅ **Dominio personalizado**
✅ **Form handling**
✅ **Functions serverless**

### 🎉 Resultado Final

Una vez desplegado:
- **Frontend:** https://tu-app.netlify.app
- **Backend:** https://tu-backend.railway.app
- **Status:** 🚀 **Producción lista**

**¡Tu aplicación de asistencia estará disponible globalmente en Netlify!** 🌍
