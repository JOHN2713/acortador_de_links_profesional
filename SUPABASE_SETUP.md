# 🗄️ Configuración de Supabase para Acortador de URLs

Esta guía te ayudará a configurar Supabase paso a paso para tu aplicación de acortador de URLs.

## 📋 Requisitos Previos

- Cuenta en Supabase (gratuita): https://supabase.com
- Navegador web

---

## 🚀 Pasos de Configuración

### **PASO 1: Crear un Proyecto en Supabase**

1. Ve a https://app.supabase.com
2. Haz click en **"New Project"**
3. Completa la información:
   - **Name**: `url-shortener` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (guárdala en un lugar seguro)
   - **Region**: Selecciona la más cercana a tu ubicación
   - **Pricing Plan**: Free (gratis)
4. Click en **"Create new project"**
5. Espera 1-2 minutos mientras se crea el proyecto

---

### **PASO 2: Configurar la Base de Datos**

1. En el panel lateral, ve a **SQL Editor**
2. Click en **"New query"**
3. Copia y pega TODO el contenido del archivo `database_setup.sql`
4. Click en **"Run"** (o presiona `Ctrl + Enter`)
5. Deberías ver: ✅ **Success. No rows returned**

Esto creará:
- ✅ Tabla `urls` para almacenar las URLs acortadas
- ✅ Tabla `url_analytics` para registrar clicks
- ✅ Índices para optimizar el rendimiento
- ✅ Triggers para actualizar automáticamente el contador de clicks
- ✅ Políticas de seguridad (Row Level Security)
- ✅ Datos de ejemplo para pruebas

---

### **PASO 3: Verificar las Tablas**

1. Ve a **Table Editor** en el panel lateral
2. Deberías ver dos tablas:
   - 📊 `urls`
   - 📈 `url_analytics`
3. Click en `urls` para ver los datos de ejemplo

---

### **PASO 4: Obtener las Credenciales de API**

1. Ve a **Settings** (⚙️) en el panel lateral
2. Click en **API** 
3. Encontrarás dos valores importantes:

   **a) Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **b) anon/public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```

4. **¡IMPORTANTE!** Copia estos valores, los necesitarás en el siguiente paso

---

### **PASO 5: Configurar Variables de Entorno**

1. En la raíz de tu proyecto, crea un archivo llamado `.env`
2. Copia el contenido de `.env.example`
3. Reemplaza los valores con tus credenciales de Supabase:

```env
# Configuración de Flask
SECRET_KEY=cambia-esto-por-una-clave-super-secreta-random

# Configuración de Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL base para desarrollo
BASE_URL=http://localhost:5000
```

4. Guarda el archivo `.env`

---

### **PASO 6: Probar la Conexión**

1. Abre una terminal en la carpeta del proyecto
2. Ejecuta:
   ```bash
   python app.py
   ```
3. Busca en la consola el mensaje:
   ```
   ✅ Conexión exitosa a Supabase
   ```

Si ves este mensaje, ¡todo está configurado correctamente! 🎉

---

## 🧪 Probar la Aplicación

1. Ve a `http://localhost:5000` en tu navegador
2. Acorta una URL con un nombre personalizado, por ejemplo:
   - **URL**: `https://teams.microsoft.com/l/meetup-join/...`
   - **Nombre**: `reunion-equipo`
3. Obtendrás: `http://localhost:5000/reunion-equipo`
4. Ve a Supabase → Table Editor → `urls` para ver el registro guardado

---

## 📊 Ver Estadísticas

### En Supabase:

1. **Ver todas las URLs:**
   ```sql
   SELECT * FROM urls ORDER BY created_at DESC;
   ```

2. **Ver URLs más clickeadas:**
   ```sql
   SELECT short_code, original_url, clicks 
   FROM urls 
   ORDER BY clicks DESC 
   LIMIT 10;
   ```

3. **Ver clicks recientes:**
   ```sql
   SELECT u.short_code, a.clicked_at, a.ip_address
   FROM url_analytics a
   JOIN urls u ON u.id = a.url_id
   ORDER BY a.clicked_at DESC
   LIMIT 20;
   ```

### Desde la Aplicación:

- **Ver estadísticas de una URL:**
  ```
  http://localhost:5000/api/stats/reunion-equipo
  ```

- **Ver todas las URLs:**
  ```
  http://localhost:5000/api/urls
  ```

---

## 🔒 Seguridad

### Variables de Entorno

- ✅ Nunca compartas tu archivo `.env`
- ✅ El archivo `.env` ya está en `.gitignore`
- ✅ Usa diferentes keys para desarrollo y producción

### Row Level Security (RLS)

Las políticas configuradas permiten:
- ✅ Lectura pública de URLs activas
- ✅ Inserción pública de nuevas URLs
- ✅ Lectura de analytics
- ⚠️ No permite borrado o modificación sin autenticación

---

## 🐛 Solución de Problemas

### Error: "Supabase no está configurado"

**Problema:** No se encuentran las variables de entorno.

**Solución:**
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que las variables están correctamente escritas
3. Reinicia la aplicación

### Error: "Invalid API key"

**Problema:** La key de Supabase es incorrecta.

**Solución:**
1. Ve a Supabase → Settings → API
2. Copia nuevamente la "anon public" key
3. Actualiza `.env`

### Error al crear tablas

**Problema:** El script SQL no se ejecutó correctamente.

**Solución:**
1. Ve a SQL Editor en Supabase
2. Ejecuta cada sección del script una por una
3. Verifica los mensajes de error

---

## 📚 Recursos Adicionales

- 📖 Documentación de Supabase: https://supabase.com/docs
- 🎓 Tutoriales: https://supabase.com/docs/guides/getting-started
- 💬 Comunidad: https://github.com/supabase/supabase/discussions

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Supabase
- [ ] Script SQL ejecutado correctamente
- [ ] Tablas `urls` y `url_analytics` visibles en Table Editor
- [ ] Credenciales copiadas (URL y Key)
- [ ] Archivo `.env` creado y configurado
- [ ] Aplicación ejecutándose con mensaje "✅ Conexión exitosa a Supabase"
- [ ] URL de prueba creada y funcionando

---

¡Listo! Ahora tu aplicación está completamente conectada a Supabase. 🎉
