from flask import Flask, render_template, request, jsonify, redirect
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import os
import secrets
import string

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)

# Configuración
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5000')

# Inicializar cliente de Supabase
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Conexión exitosa a Supabase")
    except Exception as e:
        print(f"❌ Error al conectar con Supabase: {e}")
else:
    print("⚠️  Variables de entorno de Supabase no configuradas")

def generate_short_code(length=6):
    """Genera un código corto aleatorio único"""
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

@app.route('/')
def index():
    """Página principal con el formulario de acortador"""
    return render_template('index.html')

@app.route('/shorten', methods=['POST'])
def shorten_url():
    """Endpoint para acortar URLs con Supabase"""
    try:
        if not supabase:
            return jsonify({'error': 'Supabase no está configurado. Revisa tus variables de entorno.'}), 500
        
        data = request.get_json()
        
        # Validar datos requeridos
        original_url = data.get('original_url')
        if not original_url:
            return jsonify({'error': 'La URL original es requerida'}), 400
        
        # Obtener datos opcionales
        custom_name = data.get('custom_name', '').strip()
        description = data.get('description', '').strip()
        
        # Validar URL
        if not original_url.startswith(('http://', 'https://')):
            return jsonify({'error': 'La URL debe comenzar con http:// o https://'}), 400
        
        # Validar nombre personalizado
        if custom_name:
            if len(custom_name) < 3:
                return jsonify({'error': 'El nombre personalizado debe tener al menos 3 caracteres'}), 400
            if len(custom_name) > 100:
                return jsonify({'error': 'El nombre personalizado es demasiado largo (máximo 100 caracteres)'}), 400
            # Validar caracteres permitidos
            if not all(c.isalnum() or c in '-_' for c in custom_name):
                return jsonify({'error': 'El nombre personalizado solo puede contener letras, números, guiones y guiones bajos'}), 400
        
        # Generar o usar código corto
        short_code = custom_name if custom_name else generate_short_code()
        
        # Verificar si el código ya existe
        existing = supabase.table('urls').select('short_code').eq('short_code', short_code).execute()
        if existing.data:
            return jsonify({'error': 'Este nombre personalizado ya está en uso. Por favor, elige otro.'}), 400
        
        # Insertar en Supabase
        url_data = {
            'original_url': original_url,
            'short_code': short_code,
            'description': description if description else None,
            'clicks': 0,
            'is_active': True
        }
        
        result = supabase.table('urls').insert(url_data).execute()
        
        if not result.data:
            return jsonify({'error': 'Error al guardar la URL en la base de datos'}), 500
        
        # Construir URL corta
        short_url = f"{BASE_URL}/{short_code}"
        
        # Respuesta exitosa
        return jsonify({
            'success': True,
            'short_url': short_url,
            'short_code': short_code,
            'original_url': original_url,
            'created_at': result.data[0]['created_at'],
            'clicks': 0,
            'id': result.data[0]['id']
        }), 200
        
    except Exception as e:
        print(f"❌ Error en /shorten: {str(e)}")
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@app.route('/<short_code>')
def redirect_to_url(short_code):
    """Redirigir desde URL corta a URL original y registrar analytics"""
    try:
        if not supabase:
            return "Servicio no disponible", 503
        
        # Buscar la URL en Supabase
        result = supabase.table('urls').select('*').eq('short_code', short_code).eq('is_active', True).execute()
        
        if not result.data:
            return render_template('404.html', short_code=short_code), 404
        
        url_data = result.data[0]
        
        # Registrar el click en analytics
        analytics_data = {
            'url_id': url_data['id'],
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'referer': request.headers.get('Referer', '')
        }
        
        # Insertar en analytics (el trigger actualizará el contador automáticamente)
        try:
            supabase.table('url_analytics').insert(analytics_data).execute()
        except Exception as e:
            print(f"⚠️  Error al registrar analytics: {e}")
            # No fallar la redirección si hay error en analytics
        
        # Redirigir a la URL original
        return redirect(url_data['original_url'], code=302)
        
    except Exception as e:
        print(f"❌ Error en redirección: {str(e)}")
        return "Error al procesar la solicitud", 500

@app.route('/api/stats/<short_code>')
def get_stats(short_code):
    """Obtener estadísticas de una URL"""
    try:
        if not supabase:
            return jsonify({'error': 'Servicio no disponible'}), 503
        
        # Buscar la URL
        result = supabase.table('urls').select('*').eq('short_code', short_code).execute()
        
        if not result.data:
            return jsonify({'error': 'URL no encontrada'}), 404
        
        url_data = result.data[0]
        
        # Obtener analytics detallados
        analytics = supabase.table('url_analytics').select('*').eq('url_id', url_data['id']).order('clicked_at', desc=True).limit(100).execute()
        
        # Construir respuesta
        response = {
            'short_code': url_data['short_code'],
            'original_url': url_data['original_url'],
            'description': url_data['description'],
            'created_at': url_data['created_at'],
            'clicks': url_data['clicks'],
            'is_active': url_data['is_active'],
            'recent_clicks': analytics.data if analytics.data else []
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Error en /api/stats: {str(e)}")
        return jsonify({'error': 'Error al obtener estadísticas'}), 500

@app.route('/api/urls')
def get_all_urls():
    """Obtener todas las URLs (limitadas a las 50 más recientes)"""
    try:
        if not supabase:
            return jsonify({'error': 'Servicio no disponible'}), 503
        
        result = supabase.table('urls').select('*').eq('is_active', True).order('created_at', desc=True).limit(50).execute()
        
        return jsonify({
            'success': True,
            'urls': result.data,
            'count': len(result.data)
        }), 200
        
    except Exception as e:
        print(f"❌ Error en /api/urls: {str(e)}")
        return jsonify({'error': 'Error al obtener URLs'}), 500

@app.route('/mis-urls')
def mis_urls():
    """Página para ver todas las URLs creadas"""
    return render_template('mis_urls.html')

@app.route('/estadisticas')
def estadisticas():
    """Página de estadísticas generales"""
    return render_template('estadisticas.html')

@app.route('/estadisticas/<short_code>')
def estadisticas_url(short_code):
    """Página de estadísticas de una URL específica"""
    try:
        if not supabase:
            return "Servicio no disponible", 503
        
        # Buscar la URL
        result = supabase.table('urls').select('*').eq('short_code', short_code).execute()
        
        if not result.data:
            return render_template('404.html', short_code=short_code), 404
        
        return render_template('estadisticas.html', url_data=result.data[0])
        
    except Exception as e:
        print(f"❌ Error en /estadisticas/{short_code}: {str(e)}")
        return "Error al cargar estadísticas", 500

@app.route('/api/urls/<url_id>', methods=['DELETE'])
def delete_url(url_id):
    """Eliminar una URL (marcar como inactiva)"""
    try:
        if not supabase:
            return jsonify({'error': 'Servicio no disponible'}), 503
        
        # Marcar como inactiva en lugar de eliminar
        result = supabase.table('urls').update({
            'is_active': False
        }).eq('id', url_id).execute()
        
        if result.data:
            return jsonify({'success': True, 'message': 'URL eliminada'}), 200
        else:
            return jsonify({'error': 'URL no encontrada'}), 404
        
    except Exception as e:
        print(f"❌ Error al eliminar URL: {str(e)}")
        return jsonify({'error': 'Error al eliminar URL'}), 500

if __name__ == '__main__':
    # Modo desarrollo
    app.run(debug=True, host='0.0.0.0', port=5000)

