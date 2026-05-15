-- =====================================================
-- SINCRONIZAR CONTADOR DE CLICKS
-- =====================================================
-- Este script sincroniza el contador de clicks en la tabla urls
-- con los registros reales de la tabla url_analytics
-- =====================================================

-- Ver estado ANTES de la sincronización
SELECT '📊 ESTADO ANTES DE SINCRONIZAR' AS info;
SELECT 
    u.short_code,
    u.clicks AS clicks_contador,
    COUNT(a.id) AS clicks_reales,
    u.clicks - COUNT(a.id) AS diferencia
FROM urls u
LEFT JOIN url_analytics a ON a.url_id = u.id
WHERE u.is_active = TRUE
GROUP BY u.id, u.short_code, u.clicks
ORDER BY ABS(u.clicks - COUNT(a.id)) DESC;

-- =====================================================
-- SINCRONIZACIÓN
-- =====================================================

-- Actualizar todos los contadores basándose en los registros reales
UPDATE urls u
SET clicks = (
    SELECT COUNT(*) 
    FROM url_analytics a 
    WHERE a.url_id = u.id
),
updated_at = TIMEZONE('utc', NOW())
WHERE u.is_active = TRUE;

-- =====================================================
-- VERIFICACIÓN POST-SINCRONIZACIÓN
-- =====================================================

-- Ver estado DESPUÉS de la sincronización
SELECT '✅ ESTADO DESPUÉS DE SINCRONIZAR' AS info;
SELECT 
    u.short_code,
    u.clicks AS clicks_contador,
    COUNT(a.id) AS clicks_reales,
    u.clicks - COUNT(a.id) AS diferencia
FROM urls u
LEFT JOIN url_analytics a ON a.url_id = u.id
WHERE u.is_active = TRUE
GROUP BY u.id, u.short_code, u.clicks
ORDER BY u.clicks DESC;

-- Resumen
SELECT 
    COUNT(*) AS total_urls,
    SUM(clicks) AS total_clicks
FROM urls
WHERE is_active = TRUE;

SELECT '✅ Sincronización completada' AS resultado;
