-- =====================================================
-- SCRIPT PARA VERIFICAR EL TRIGGER DE CLICKS
-- =====================================================
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Verificar que el trigger existe
SELECT 
    tgname AS trigger_name,
    tgtype AS trigger_type,
    tgenabled AS enabled
FROM pg_trigger 
WHERE tgname = 'trigger_increment_clicks';

-- 2. Verificar que la función existe
SELECT 
    proname AS function_name,
    prosrc AS function_code
FROM pg_proc 
WHERE proname = 'increment_url_clicks';

-- 3. Ver todas las URLs y sus clicks actuales
SELECT 
    short_code,
    original_url,
    clicks,
    created_at,
    is_active
FROM urls 
ORDER BY created_at DESC;

-- 4. Ver todos los registros de analytics
SELECT 
    a.id,
    u.short_code,
    a.clicked_at,
    a.ip_address,
    LEFT(a.user_agent, 50) AS user_agent_preview
FROM url_analytics a
JOIN urls u ON u.id = a.url_id
ORDER BY a.clicked_at DESC
LIMIT 20;

-- 5. Comparar: Clicks en contador vs clicks en analytics
SELECT 
    u.short_code,
    u.clicks AS clicks_contador,
    COUNT(a.id) AS clicks_analytics,
    u.clicks - COUNT(a.id) AS diferencia
FROM urls u
LEFT JOIN url_analytics a ON a.url_id = u.id
GROUP BY u.id, u.short_code, u.clicks
ORDER BY u.created_at DESC;

-- =====================================================
-- SI EL TRIGGER NO EXISTE, RECREARLO:
-- =====================================================
/*
-- Paso 1: Crear la función
CREATE OR REPLACE FUNCTION increment_url_clicks()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE urls 
    SET clicks = clicks + 1 
    WHERE id = NEW.url_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 2: Crear el trigger
DROP TRIGGER IF EXISTS trigger_increment_clicks ON url_analytics;
CREATE TRIGGER trigger_increment_clicks
    AFTER INSERT ON url_analytics
    FOR EACH ROW
    EXECUTE FUNCTION increment_url_clicks();

-- Paso 3: Verificar que funcione con una prueba manual
-- (Reemplaza 'TU_URL_ID' con un ID real de la tabla urls)
INSERT INTO url_analytics (url_id, ip_address, user_agent) 
VALUES ('TU_URL_ID', '127.0.0.1', 'Test Browser');

-- Paso 4: Verificar que el contador aumentó
SELECT short_code, clicks FROM urls WHERE id = 'TU_URL_ID';
*/

-- =====================================================
-- CORREGIR CONTADOR SI HAY DIFERENCIA:
-- =====================================================
/*
-- Si el trigger no estaba funcionando, puedes sincronizar
-- el contador con los datos reales de analytics:
UPDATE urls u
SET clicks = (
    SELECT COUNT(*) 
    FROM url_analytics a 
    WHERE a.url_id = u.id
)
WHERE EXISTS (
    SELECT 1 FROM url_analytics WHERE url_id = u.id
);
*/
