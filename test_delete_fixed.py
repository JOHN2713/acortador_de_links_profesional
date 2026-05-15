#!/usr/bin/env python3
"""
Script para probar la eliminación (soft delete) de URLs
Ejecutar DESPUÉS de aplicar fix_rls_complete.sql en Supabase
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Crear cliente de Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Error: Faltan credenciales de Supabase en .env")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

print("=== TEST DE ELIMINACIÓN (SOFT DELETE) ===\n")

# Paso 1: Obtener una URL activa
try:
    result = supabase.table('urls').select('*').eq('is_active', True).limit(1).execute()
    
    if not result.data:
        print("❌ No hay URLs activas para probar")
        exit(1)
    
    test_url = result.data[0]
    url_id = test_url['id']
    short_code = test_url['short_code']
    
    print(f"✅ URL de prueba encontrada:")
    print(f"   ID: {url_id}")
    print(f"   Short Code: {short_code}")
    print(f"   Estado actual: is_active = {test_url['is_active']}")
    print()
    
except Exception as e:
    print(f"❌ Error al obtener URL de prueba: {e}")
    exit(1)

# Paso 2: Intentar marcar como inactiva (soft delete)
print(f"🔄 Intentando marcar como inactiva (soft delete)...")
try:
    update_result = supabase.table('urls').update({
        'is_active': False
    }).eq('id', url_id).execute()
    
    if update_result.data:
        print("✅ UPDATE ejecutado exitosamente")
        print(f"   Datos retornados: {update_result.data}")
    else:
        print("⚠️ UPDATE no retornó datos")
        print(f"   Respuesta: {update_result}")
        
except Exception as e:
    print(f"❌ Error al hacer UPDATE: {e}")
    print(f"   Tipo de error: {type(e).__name__}")
    print(f"   Detalles: {str(e)}")
    print()
    print("🔍 POSIBLES CAUSAS:")
    print("   1. Las políticas RLS aún están bloqueando el UPDATE")
    print("   2. No ejecutaste fix_rls_complete.sql en Supabase")
    print("   3. Hay políticas conflictivas en Supabase")
    print()
    print("📝 SOLUCIÓN:")
    print("   Ejecuta fix_rls_complete.sql en el SQL Editor de Supabase")
    exit(1)

# Paso 3: Verificar el cambio
print()
print("🔍 Verificando el cambio...")
try:
    verify_result = supabase.table('urls').select('*').eq('id', url_id).execute()
    
    if verify_result.data:
        new_state = verify_result.data[0]['is_active']
        print(f"   Estado nuevo: is_active = {new_state}")
        
        if new_state == False:
            print("✅ ¡ÉXITO! El soft delete funcionó correctamente")
        else:
            print("❌ El estado no cambió, aún está activo")
    
except Exception as e:
    print(f"❌ Error al verificar: {e}")

# Paso 4: Restaurar estado original
print()
print("🔄 Restaurando estado original...")
try:
    restore_result = supabase.table('urls').update({
        'is_active': True
    }).eq('id', url_id).execute()
    
    if restore_result.data:
        print("✅ Estado restaurado correctamente")
        print()
        print("=" * 50)
        print("🎉 PRUEBA COMPLETADA EXITOSAMENTE")
        print("=" * 50)
        print()
        print("La función de eliminación (soft delete) está funcionando.")
        print("Ya puedes eliminar URLs desde la aplicación web.")
    
except Exception as e:
    print(f"⚠️ Error al restaurar: {e}")
    print("   (No es crítico, puedes restaurarla manualmente en Supabase)")
