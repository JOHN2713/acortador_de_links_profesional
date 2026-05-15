-- =====================================================
-- FIX PARA EL TRIGGER DE CLICKS
-- =====================================================
-- Este script corrige el problema de las políticas RLS
-- que impiden que el trigger actualice el contador
-- =====================================================

-- PASO 1: Verificar estado actual
SELECT 'Estado Actual de URLs' AS info;
SELECT short_code, clicks, is_active FROM urls ORDER BY created_at DESC LIMIT 5;

-- PASO 2: Verificar que el trigger existe
SELECT 'Verificando Trigger' AS info;
SELECT 
    tgname AS trigger_name,
    tgtype AS trigger_type,
    tgenabled AS enabled
FROM pg_trigger 
WHERE tgname = 'trigger_increment_clicks';

-- =====================================================
-- SOLUCIÓN PRINCIPAL: Agregar política para el trigger
-- =====================================================

-- PASO 3: Eliminar políticas existentes que puedan causar conflicto
DROP POLICY IF EXISTS "Permitir lectura pública de URLs" ON urls;
DROP POLICY IF EXISTS "Permitir inserción pública de URLs" ON urls;
DROP POLICY IF EXISTS "Permitir actualización pública de URLs" ON urls;
DROP POLICY IF EXISTS "Permitir actualización de contador por trigger" ON urls;

-- PASO 4: Crear políticas correctas

-- Permitir lectura pública de URLs activas
CREATE POLICY "Permitir lectura pública de URLs"
    ON urls FOR SELECT
    USING (is_active = TRUE);

-- Permitir inserción pública de URLs
CREATE POLICY "Permitir inserción pública de URLs"
    ON urls FOR INSERT
    WITH CHECK (TRUE);

-- CRÍTICO: Permitir actualización del contador de clicks
-- Esta política permite que el trigger actualice el campo clicks
CREATE POLICY "Permitir actualización de contador por trigger"
    ON urls FOR UPDATE
    USING (TRUE)
    WITH CHECK (TRUE);

-- PASO 5: Verificar políticas de analytics
DROP POLICY IF EXISTS "Permitir lectura pública de analytics" ON url_analytics;
DROP POLICY IF EXISTS "Permitir inserción pública de analytics" ON url_analytics;

CREATE POLICY "Permitir lectura pública de analytics"
    ON url_analytics FOR SELECT
    USING (TRUE);

CREATE POLICY "Permitir inserción pública de analytics"
    ON url_analytics FOR INSERT
    WITH CHECK (TRUE);

-- =====================================================
-- RECREAR TRIGGER (por si acaso)
-- =====================================================

-- PASO 6: Recrear la función
CREATE OR REPLACE FUNCTION increment_url_clicks()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE urls 
    SET clicks = clicks + 1,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.url_id;
    
    -- Log para debugging (opcional)
    RAISE NOTICE 'Click incrementado para URL ID: %', NEW.url_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 7: Recrear el trigger
DROP TRIGGER IF EXISTS trigger_increment_clicks ON url_analytics;
CREATE TRIGGER trigger_increment_clicks
    AFTER INSERT ON url_analytics
    FOR EACH ROW
    EXECUTE FUNCTION increment_url_clicks();

-- =====================================================
-- PRUEBA MANUAL
-- =====================================================

-- PASO 8: Hacer una prueba manual
DO $$
DECLARE
    test_url_id UUID;
    clicks_before INTEGER;
    clicks_after INTEGER;
BEGIN
    -- Obtener una URL de prueba
    SELECT id, clicks INTO test_url_id, clicks_before 
    FROM urls 
    WHERE is_active = TRUE 
    LIMIT 1;
    
    IF test_url_id IS NULL THEN
        RAISE NOTICE 'No hay URLs para probar';
        RETURN;
    END IF;
    
    RAISE NOTICE 'URL de prueba: %, Clicks antes: %', test_url_id, clicks_before;
    
    -- Insertar un click de prueba
    INSERT INTO url_analytics (url_id, ip_address, user_agent) 
    VALUES (test_url_id, '127.0.0.1', 'Test SQL Script');
    
    -- Verificar resultado
    SELECT clicks INTO clicks_after 
    FROM urls 
    WHERE id = test_url_id;
    
    RAISE NOTICE 'Clicks después: %', clicks_after;
    
    IF clicks_after = clicks_before + 1 THEN
        RAISE NOTICE '✅ ÉXITO - El trigger funciona correctamente';
    ELSE
        RAISE NOTICE '❌ ERROR - El trigger NO funcionó (Antes: %, Después: %)', clicks_before, clicks_after;
    END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Ver URLs actualizadas
SELECT 'URLs Actualizadas' AS info;
SELECT short_code, original_url, clicks, updated_at 
FROM urls 
ORDER BY updated_at DESC 
LIMIT 5;

-- Ver últimos clicks registrados
SELECT 'Últimos Clicks' AS info;
SELECT 
    u.short_code,
    a.clicked_at,
    a.ip_address
FROM url_analytics a
JOIN urls u ON u.id = a.url_id
ORDER BY a.clicked_at DESC
LIMIT 5;

-- Verificar consistencia
SELECT 'Verificación de Consistencia' AS info;
SELECT 
    u.short_code,
    u.clicks AS clicks_contador,
    COUNT(a.id) AS clicks_reales,
    u.clicks - COUNT(a.id) AS diferencia
FROM urls u
LEFT JOIN url_analytics a ON a.url_id = u.id
WHERE u.is_active = TRUE
GROUP BY u.id, u.short_code, u.clicks
ORDER BY u.created_at DESC;

-- =====================================================
-- MENSAJE FINAL
-- =====================================================
SELECT '✅ Script completado - Verifica los resultados arriba' AS resultado;
SELECT 'Si la diferencia es 0, el trigger funciona correctamente' AS nota;
SELECT 'Si hay diferencia, ejecuta sync_clicks.sql para sincronizar' AS recomendacion;
