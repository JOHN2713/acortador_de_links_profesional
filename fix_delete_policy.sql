-- =====================================================
-- FIX PARA PERMITIR ELIMINACIÓN (SOFT DELETE)
-- =====================================================
-- Soluciona el error 500 al intentar eliminar URLs
-- =====================================================

-- PASO 1: Ver las políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'urls';

-- =====================================================
-- SOLUCIÓN: Actualizar política de UPDATE
-- =====================================================

-- Eliminar la política restrictiva anterior (si existe)
DROP POLICY IF EXISTS "Permitir actualización de contador por trigger" ON urls;

-- Crear nueva política que permita UPDATE de todos los campos necesarios
CREATE POLICY "Permitir actualización completa de URLs"
    ON urls FOR UPDATE
    USING (TRUE)
    WITH CHECK (TRUE);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver políticas actualizadas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'urls';

-- =====================================================
-- PRUEBA MANUAL (Opcional)
-- =====================================================

-- Obtener una URL de prueba
SELECT id, short_code, is_active FROM urls LIMIT 1;

-- Intentar marcar como inactiva (usa el ID de la consulta anterior)
-- UPDATE urls SET is_active = FALSE WHERE id = 'TU_URL_ID';

-- Verificar el cambio
-- SELECT id, short_code, is_active FROM urls WHERE id = 'TU_URL_ID';

-- Reactivar la URL (opcional, para no perder datos)
-- UPDATE urls SET is_active = TRUE WHERE id = 'TU_URL_ID';

SELECT '✅ Políticas actualizadas - Ahora puedes eliminar URLs' AS resultado;
