"""
Script de prueba para verificar el sistema de clicks
"""
from dotenv import load_dotenv
from supabase import create_client
import os
import time

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Variables de entorno no configuradas")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("TEST DEL SISTEMA DE CLICKS")
print("=" * 60)

# 1. Listar todas las URLs
print("\n1️⃣  URLs Actuales:")
print("-" * 60)
urls = supabase.table('urls').select('*').eq('is_active', True).execute()
if urls.data:
    for url in urls.data:
        print(f"   • {url['short_code']:15} | Clicks: {url['clicks']:3} | {url['original_url'][:50]}")
    print(f"\n   Total URLs: {len(urls.data)}")
else:
    print("   ⚠️  No hay URLs en la base de datos")
    exit(0)

# 2. Seleccionar la primera URL para prueba
test_url = urls.data[0]
print(f"\n2️⃣  URL de Prueba Seleccionada:")
print("-" * 60)
print(f"   Short Code: {test_url['short_code']}")
print(f"   URL Original: {test_url['original_url']}")
print(f"   Clicks Actuales: {test_url['clicks']}")
print(f"   ID: {test_url['id']}")

# 3. Registrar un click de prueba en analytics
print(f"\n3️⃣  Registrando Click de Prueba...")
print("-" * 60)
try:
    analytics_data = {
        'url_id': test_url['id'],
        'ip_address': '127.0.0.1',
        'user_agent': 'Test Script - Python',
        'referer': 'test_clicks.py'
    }
    
    analytics_result = supabase.table('url_analytics').insert(analytics_data).execute()
    
    if analytics_result.data:
        print(f"   ✅ Click registrado correctamente en analytics")
        print(f"   Analytics ID: {analytics_result.data[0]['id']}")
    else:
        print(f"   ❌ Error: No se insertó en analytics")
        exit(1)
        
except Exception as e:
    print(f"   ❌ Error al insertar en analytics: {e}")
    exit(1)

# 4. Esperar un momento para que el trigger se ejecute
print(f"\n4️⃣  Esperando que el trigger actualice el contador...")
time.sleep(2)

# 5. Verificar si el contador se incrementó
print(f"\n5️⃣  Verificando Resultado:")
print("-" * 60)
updated_url = supabase.table('urls').select('*').eq('id', test_url['id']).execute()

if updated_url.data:
    old_clicks = test_url['clicks']
    new_clicks = updated_url.data[0]['clicks']
    
    print(f"   Clicks Antes: {old_clicks}")
    print(f"   Clicks Después: {new_clicks}")
    
    if new_clicks == old_clicks + 1:
        print(f"\n   ✅ ¡ÉXITO! El trigger funcionó correctamente")
        print(f"   ✅ El contador se incrementó de {old_clicks} a {new_clicks}")
    elif new_clicks == old_clicks:
        print(f"\n   ❌ PROBLEMA: El trigger NO funcionó")
        print(f"   ❌ El contador se quedó en {old_clicks}")
        print(f"\n   🔧 Posibles causas:")
        print(f"      1. El trigger no existe en la base de datos")
        print(f"      2. Las políticas RLS están bloqueando la actualización")
        print(f"      3. Hay un error en la función del trigger")
        print(f"\n   💡 Solución: Ejecuta el archivo 'fix_trigger.sql' en Supabase")
    else:
        print(f"\n   ⚠️  ADVERTENCIA: Contador cambió inesperadamente")
        print(f"   ⚠️  Diferencia: {new_clicks - old_clicks}")
else:
    print("   ❌ Error: No se pudo obtener la URL actualizada")

# 6. Contar analytics registrados vs contador
print(f"\n6️⃣  Verificación de Consistencia:")
print("-" * 60)
all_analytics = supabase.table('url_analytics').select('id').eq('url_id', test_url['id']).execute()
analytics_count = len(all_analytics.data) if all_analytics.data else 0
url_clicks = updated_url.data[0]['clicks'] if updated_url.data else 0

print(f"   Registros en Analytics: {analytics_count}")
print(f"   Contador en URL: {url_clicks}")
print(f"   Diferencia: {analytics_count - url_clicks}")

if analytics_count == url_clicks:
    print(f"\n   ✅ Datos consistentes - Todo está sincronizado")
elif analytics_count > url_clicks:
    print(f"\n   ⚠️  Hay {analytics_count - url_clicks} clicks no contabilizados")
    print(f"   💡 Ejecuta 'sync_clicks.sql' para sincronizar")

print("\n" + "=" * 60)
print("TEST COMPLETADO")
print("=" * 60 + "\n")
