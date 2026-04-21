# 🔗 Acortador de URLs Profesional

Una aplicación web moderna y completa para acortar URLs con nombres personalizados, seguimiento de clicks y analytics detallados.

![Python](https://img.shields.io/badge/Python-3.13-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Características

- 🎨 **Interfaz Moderna:** Diseño oscuro profesional con animaciones suaves
- 🔗 **URLs Personalizadas:** Crea nombres memorables para tus links
- 📊 **Analytics en Tiempo Real:** Seguimiento completo de clicks
- 💾 **Base de Datos Persistente:** Supabase (PostgreSQL)
- 📱 **Responsive:** Funciona perfecto en móvil y desktop
- 🚀 **Producción Ready:** Desplegable en minutos
- 🔒 **Seguro:** SSL, RLS, validación de datos
- ⚡ **Rápido:** Redirecciones instantáneas

## 🎯 Demo

```
URL Original: https://teams.microsoft.com/l/meetup-join/19%3ameeting_xxxxx
Nombre Personalizado: capacitacion-seo-10am
URL Resultante: https://tu-dominio.com/capacitacion-seo-10am
```

## 🛠️ Tecnologías

- **Backend:** Flask 3.0 (Python)
- **Base de Datos:** Supabase (PostgreSQL)
- **Frontend:** HTML5, CSS3, JavaScript
- **Servidor:** Gunicorn
- **Hosting:** Render (recomendado)

## � Quick Start (Producción)

### Despliegue en Render (5 minutos)

1. **Fork este repositorio**

2. **Crear cuenta en Render:** https://render.com

3. **Crear Web Service:**
   - New + → Web Service
   - Conecta tu repositorio
   - Runtime: Python 3
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn app:app`

4. **Configurar variables de entorno:**
   ```env
   SECRET_KEY=tu-secret-key
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu-anon-key
   BASE_URL=https://tu-app.onrender.com
   ```

5. **Deploy** → ¡Listo! 🎉

📖 **Guía completa:** [DEPLOY_RENDER.md](DEPLOY_RENDER.md)

---

## 💻 Instalación Local (Desarrollo)

### 1. Clonar el repositorio

```bash
git clone https://github.com/JOHN2713/acortador_de_links_profesional.git
cd acortador_de_links_profesional
```

### 2. Crear entorno virtual

```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
```

### 3. Instalar dependencias

```bash
pip � Estructura del Proyecto

```
acortador_de_links_profesional/
├── app.py                     # Aplicación Flask principal
├── requirements.txt           # Dependencias Python
├── Procfile                   # Comando para Gunicorn
├── runtime.txt                # Versión de Python
├── .env                       # Variables de entorno (NO subir a Git)
├── .gitignore                 # Archivos ignorados
│
├── static/
│   ├── css/
│   │   └── style.css         # Estilos modernos
│   └── js/
│       └── script.js         # Lógica del frontend
│
├── templates/
│   ├── index.html            # Página principal
│   └── 404.html              # Página de error
│
└── docs/
    ├── DEPLOY_RENDER.md      # Guía de despliegue
    ├── DEPLOY_OPTIONS.md     # Comparación de opciones
    ├── SUPABASE_SETUP.md     # Configuración de BD
    ├── PRODUCTION_PLAN.md    # Plan de producción
    └── database_setup.sql    # Script SQL
```

## 🎯 Roadmap

- [x] Interfaz moderna y responsive
- [x] Integración con Supabase
- [x] Analytics de clicks
- [x] Despliegue en producción
- [ ] Dashboard de estadísticas
- [ ] Autenticación de usuarios
- [ ] API REST documentada
- [ ] QR codes para URLs
- [ ] Expiración programada de URLs
- [ ] D
## 📊 Estructura del Proyecto

```
App de acortadores url/
├── static/
│   ├── css/
│   │   └── style.css       # Estilos de la aplicación
│   └── js/
│       └── script.js       # Lógica del frontend
├── templates/
│   └── index.html          # Página principal
├── app.py                  # Aplicación Flask
├── requirements.txt        # Dependencias Python
├── .gitignore             # Archivos ignorados por Git
└── README.md              # Este archivo
```
📖 Uso

### Acortar una URL

1. **Ingresar URL original:**
   ```
   https://teams.microsoft.com/l/meetup-join/19%3ameeting_xxxxx
   ```

2. **Nombre personalizado (opcional):**
   ```
   reunion-equipo-lunes
   ```

3. **Descripción (opcional):**
   ```
   Reunión de equipo - Lunes 10 AM
   ```

4. **Click en "Acortar URL"**

5. **Resultado:**
   ```
   https://tu-dominio.com/reunion-equipo-lunes
   ```

### Ver Estadísticas

```bash
# API endpoint
GET https://tu-dominio.com/api/stats/reunion-equipo-lunes

# Respuesta
{
  "short_code": "reunion-equipo-lunes",
  "original_url": "https://teams.microsoft.com/...",
  "clicks": 47,
  "created_at": "2026-04-21T10:30:00",
  "recent_clicks": [...]
}
```

## 📊 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Página principal |
| `POST` | `/shorten` | Acortar URL |
| `GET` | `/<short_code>` | Redirigir a URL original |
| `GET` | `/api/stats/<short_code>` | Obtener estadísticas |
| `GET` | `/api/urls` | Listar todas las URLs |

## 🔒 Seguridad

- ✅ Variables de entorno protegidas
- ✅ Validación de inputs
- ✅ Row Level Security (RLS) en Supabase
- ✅ SSL/HTTPS automático
- ✅ Prevención de SQL injection
- ✅ Rate limiting (configurar en producción)

## 🐛 Troubleshooting

### App no conecta a Supabase
```bash
# Verificar variables de entorno
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Verificar que la URL NO tenga /rest/v1/ al final
```

### Error al acortar URL
```bash
# Verificar que las tablas existan en Supabase
# Ejecutar database_setup.sql nuevamente si es necesario
```

### App se duerme (Render Free)
```bash
# Configurar UptimeRobot
# Ping cada 5 minutos para mantenerla activa
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👤 Autor

**JOHN2713**
- GitHub: [@JOHN2713](https://github.com/JOHN2713)
- Repositorio: [acortador_de_links_profesional](https://github.com/JOHN2713/acortador_de_links_profesional)

## 🙏 Agradecimientos

- [Flask](https://flask.palletsprojects.com/) - Framework web
- [Supabase](https://supabase.com/) - Base de datos
- [Render](https://render.com/) - Hosting
- [Font Awesome](https://fontawesome.com/) - Iconos
- [Google Fonts](https://fonts.google.com/) - Tipografías

## 📞 Soporte

¿Necesitas ayuda? Abre un [issue](https://github.com/JOHN2713/acortador_de_links_profesional/issues).

---

⭐ Si te gustó este proyecto, ¡dale una estrella en GitHub!

**URL Resultante:**
```
tudominio.com/capacitacion10amperseoweb
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
