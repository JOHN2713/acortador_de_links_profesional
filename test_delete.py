"""
Script para probar la eliminación de URLs
"""
from dotenv import load_dotenv
from supabase import create_client
import os

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Variables de entorno no configuradas")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("TEST DE ELIMINACIÓN DE URLs")
print("=" * 60)

# 1. Listar URLs activas
print("\n1️⃣  URLs Activas:")
print("-" * 60)
urls = supabase.table('urls').select('*').eq('is_active', True).execute()
if urls.data:
    for i, url in enumerate(urls.data[:5], 1):
        print(f"   {i}. {url['short_code']:20} | Activa: {url['is_active']} | ID: {url['id']}")
else:
    print("   ⚠️  No hay URLs activas")
    exit(0)

# 2. Seleccionar la última URL para prueba
test_url = urls.data[-1]  # Última URL
print(f"\n2️⃣  URL Seleccionada para Prueba:")
print("-" * 60)
print(f"   Short Code: {test_url['short_code']}")
print(f"   ID: {test_url['id']}")
print(f"   Estado Actual: {'Activa' if test_url['is_active'] else 'Inactiva'}")

# 3. Intentar marcar como inactiva
print(f"\n3️⃣  Intentando Marcar como Inactiva...")
print("-" * 60)
try:
    result = supabase.table('urls').update({
        'is_active': False
    }).eq('id', test_url['id']).execute()
    
    if result.data:
        print(f"   ✅ URL marcada como inactiva exitosamente")
        print(f"   Resultado: {result.data[0]['is_active']}")
    else:
        print(f"   ❌ Error: No se pudo actualizar")
        print(f"   Respuesta: {result}")
        
except Exception as e:
    print(f"   ❌ Error al actualizar: {e}")
    print(f"\n   💡 Solución: Ejecuta 'fix_delete_policy.sql' en Supabase")
    exit(1)

# 4. Verificar el cambio
print(f"\n4️⃣  Verificando Cambio...")
print("-" * 60)
updated_url = supabase.table('urls').select('*').eq('id', test_url['id']).execute()
if updated_url.data:
    is_active = updated_url.data[0]['is_active']
    print(f"   Estado Anterior: Activa")
    print(f"   Estado Actual: {'Activa' if is_active else 'Inactiva'}")
    
    if not is_active:
        print(f"\n   ✅ ¡ÉXITO! La URL se marcó como inactiva correctamente")
    else:
        print(f"\n   ❌ PROBLEMA: La URL sigue activa")

# 5. Reactivar la URL (para no perder datos)
print(f"\n5️⃣  Reactivando URL (para no perder datos)...")
print("-" * 60)
try:
    result = supabase.table('urls').update({
        'is_active': True
    }).eq('id', test_url['id']).execute()
    
    if result.data and result.data[0]['is_active']:
        print(f"   ✅ URL reactivada exitosamente")
    else:
        print(f"   ⚠️  No se pudo reactivar (esto es normal si faltan permisos)")
        
except Exception as e:
    print(f"   ⚠️  Error al reactivar: {e}")

# 6. Contar URLs activas e inactivas
print(f"\n6️⃣  Resumen:")
print("-" * 60)
active = supabase.table('urls').select('id').eq('is_active', True).execute()
inactive = supabase.table('urls').select('id').eq('is_active', False).execute()
print(f"   URLs Activas: {len(active.data)}")
print(f"   URLs Inactivas: {len(inactive.data)}")

print("\n" + "=" * 60)
print("TEST COMPLETADO")
print("=" * 60 + "\n")
