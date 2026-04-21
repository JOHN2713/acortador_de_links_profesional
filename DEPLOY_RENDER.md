# 🚀 Guía de Despliegue en Render

## ¿Por qué Render en lugar de Netlify?

**Netlify** → Sitios estáticos + Serverless functions (JavaScript)
**Render** → Aplicaciones backend (Python, Flask, Node, etc.)

Para nuestra aplicación Flask + Supabase, **Render es la opción perfecta**.

---

## 📋 Requisitos Previos

✅ Cuenta de GitHub con el repositorio
✅ Supabase configurado con las tablas
✅ 5 minutos de tu tiempo

---

## 🎯 PASO 1: Preparar el Repositorio

Los archivos ya están listos. Solo asegúrate de tener en GitHub:

```
├── app.py
├── requirements.txt
├── templates/
│   ├── index.html
│   └── 404.html
├── static/
│   ├── css/style.css
│   └── js/script.js
└── .gitignore
```

**NO subas el archivo `.env` a GitHub** (ya está en .gitignore)

---

## 🚀 PASO 2: Subir a GitHub

```bash
# Si aún no has subido los cambios
git add .
git commit -m "Preparar para despliegue en Render"
git push origin main
```

---

## 🌐 PASO 3: Crear Cuenta en Render

1. Ve a: https://render.com
2. Click en **"Get Started"**
3. Conecta con tu cuenta de **GitHub**
4. Autoriza a Render para acceder a tus repositorios

---

## 🔧 PASO 4: Crear Web Service

1. En el dashboard de Render, click en **"New +"**
2. Selecciona **"Web Service"**
3. Busca tu repositorio: `acortador_de_links_profesional`
4. Click en **"Connect"**

---

## ⚙️ PASO 5: Configuración del Servicio

Completa el formulario:

### **General:**
```
Name: acortador-urls-pro (o el que prefieras)
Region: Oregon (o el más cercano)
Branch: main
Root Directory: (dejar vacío)
Runtime: Python 3
```

### **Build Command:**
```
pip install -r requirements.txt
```

### **Start Command:**
```
gunicorn app:app
```

### **Instance Type:**
```
Free
```

---

## 🔐 PASO 6: Variables de Entorno

Scroll down hasta **"Environment Variables"** y agrega:

Click en **"Add Environment Variable"** para cada una:

```
SECRET_KEY = flask-super-secret-key-change-in-production-2026

SUPABASE_URL = https://irxlzaccrsjjnnbzziaq.supabase.co

SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyeGx6YWNjcnNqam5uYnp6aWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjgxNDAsImV4cCI6MjA5MjM0NDE0MH0.xaqUNu5NZmQju4TYdUleuixEm1J87ucsGYXh6jwZs7c

BASE_URL = https://tu-app.onrender.com
```

**IMPORTANTE:** 
- Para `BASE_URL`, Render te asignará una URL como: `https://acortador-urls-pro.onrender.com`
- Después del despliegue, regresa y actualiza `BASE_URL` con tu URL real

---

## 🚀 PASO 7: Desplegar

1. Click en **"Create Web Service"**
2. Render comenzará a:
   - Clonar tu repositorio
   - Instalar dependencias
   - Iniciar tu aplicación
3. Espera 2-3 minutos

Verás los logs en tiempo real. Busca:
```
✅ Conexión exitosa a Supabase
==> Starting service with 'gunicorn app:app'
```

---

## ✅ PASO 8: Verificar el Despliegue

1. Una vez desplegado, verás: **"Your service is live 🎉"**
2. Click en la URL (algo como: `https://acortador-urls-pro.onrender.com`)
3. ¡Tu aplicación está funcionando!

---

## 🔄 PASO 9: Actualizar BASE_URL

1. Copia la URL completa de tu aplicación
2. Ve a **"Environment"** en el menú lateral
3. Edita la variable `BASE_URL`
4. Pega tu URL real: `https://tu-app.onrender.com`
5. Click en **"Save Changes"**
6. La app se reiniciará automáticamente

---

## 🧪 PASO 10: Probar la Aplicación

1. **Acortar una URL:**
   - Ve a tu aplicación: `https://tu-app.onrender.com`
   - Acorta una URL
   - Verifica que funcione

2. **Probar redirección:**
   - Usa la URL corta generada
   - Debería redirigir correctamente

3. **Ver en Supabase:**
   - Ve a Supabase → Table Editor → urls
   - Deberías ver tus URLs guardadas

---

## 🛡️ Evitar que se Duerma (Free Plan)

El plan gratuito se "duerme" tras 15 min de inactividad.

### Solución: UptimeRobot

1. Regístrate en: https://uptimerobot.com (gratis)
2. Click en **"Add New Monitor"**
3. Configuración:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: URL Shortener Keep-Alive
   URL: https://tu-app.onrender.com/api/urls
   Monitoring Interval: 5 minutes
   ```
4. Click en **"Create Monitor"**

¡Listo! Ahora tu app nunca se dormirá.

---

## 🔄 Actualizaciones Automáticas

Cada vez que hagas `git push` a GitHub:
- Render detectará los cambios automáticamente
- Desplegará la nueva versión
- En ~2 minutos tendrás tu app actualizada

---

## 🎨 Personalizar Dominio (Opcional)

Si tienes un dominio propio:

1. Ve a **"Settings"** → **"Custom Domain"**
2. Agrega tu dominio: `urls.tudominio.com`
3. Configura el DNS según las instrucciones
4. Render proveerá SSL gratis automáticamente

---

## 📊 Monitoreo

Render ofrece:
- ✅ Logs en tiempo real
- ✅ Métricas de CPU/RAM
- ✅ Historial de despliegues
- ✅ Rollback a versiones anteriores

---

## 🆘 Solución de Problemas

### Error: "Build Failed"
- Verifica que `requirements.txt` esté correcto
- Revisa los logs de build

### Error: "Crashed"
- Revisa que las variables de entorno estén configuradas
- Verifica los logs de runtime

### No conecta a Supabase
- Verifica `SUPABASE_URL` (sin /rest/v1/ al final)
- Verifica `SUPABASE_KEY`

---

## 💰 Costos

**Plan Free de Render:**
- ✅ Gratis para siempre
- ✅ 750 horas/mes de compute
- ✅ 100 GB de ancho de banda
- ✅ SSL automático
- ⚠️ Se duerme tras 15 min sin uso (se despierta en 30s)

**Solución al "sleep":** UptimeRobot (gratis)

---

## 🎉 ¡Listo!

Tu aplicación está desplegada y funcionando en producción:

```
Frontend: https://tu-app.onrender.com
Base de datos: Supabase
Monitoreo: UptimeRobot
Costo: $0/mes
```

---

## 📞 Soporte

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Status Page:** https://status.render.com

---

**¿Necesitas ayuda?** Los logs de Render son muy detallados y te dirán exactamente qué está fallando.
