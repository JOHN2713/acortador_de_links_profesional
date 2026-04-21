-- =====================================================
-- CONFIGURACIÓN DE BASE DE DATOS PARA ACORTADOR DE URLs
-- =====================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- https://app.supabase.com/project/_/sql

-- 1. Crear la tabla principal de URLs
CREATE TABLE IF NOT EXISTS urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    clicks INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Índices para mejorar el rendimiento
    CONSTRAINT short_code_length CHECK (char_length(short_code) >= 3 AND char_length(short_code) <= 100)
);

-- 2. Crear índices para optimizar las búsquedas
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_urls_clicks ON urls(clicks DESC);

-- 3. Crear tabla para registro de clicks (analytics)
CREATE TABLE IF NOT EXISTS url_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    country TEXT,
    city TEXT
);

-- 4. Crear índice para analytics
CREATE INDEX IF NOT EXISTS idx_analytics_url_id ON url_analytics(url_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clicked_at ON url_analytics(clicked_at DESC);

-- 5. Crear función para actualizar el contador de clicks
CREATE OR REPLACE FUNCTION increment_url_clicks()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE urls 
    SET clicks = clicks + 1,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.url_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para incrementar clicks automáticamente
DROP TRIGGER IF EXISTS trigger_increment_clicks ON url_analytics;
CREATE TRIGGER trigger_increment_clicks
    AFTER INSERT ON url_analytics
    FOR EACH ROW
    EXECUTE FUNCTION increment_url_clicks();

-- 7. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_urls_updated_at ON urls;
CREATE TRIGGER trigger_update_urls_updated_at
    BEFORE UPDATE ON urls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Habilitar Row Level Security (RLS) - Opcional pero recomendado
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_analytics ENABLE ROW LEVEL SECURITY;

-- 10. Crear políticas de acceso público para lectura
CREATE POLICY "Permitir lectura pública de URLs"
    ON urls FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Permitir inserción pública de URLs"
    ON urls FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Permitir lectura pública de analytics"
    ON url_analytics FOR SELECT
    USING (TRUE);

CREATE POLICY "Permitir inserción pública de analytics"
    ON url_analytics FOR INSERT
    WITH CHECK (TRUE);

-- =====================================================
-- DATOS DE PRUEBA (Opcional - comenta si no necesitas)
-- =====================================================

-- Insertar algunas URLs de ejemplo
INSERT INTO urls (original_url, short_code, description) VALUES
    ('https://www.google.com', 'google', 'Búsqueda en Google'),
    ('https://github.com', 'github', 'Repositorio GitHub'),
    ('https://teams.microsoft.com/l/meetup-join/example', 'capacitacion10am', 'Capacitación SEO Web - 10 AM')
ON CONFLICT (short_code) DO NOTHING;

-- =====================================================
-- CONSULTAS ÚTILES PARA VERIFICACIÓN
-- =====================================================

-- Ver todas las URLs
-- SELECT * FROM urls ORDER BY created_at DESC;

-- Ver URLs más clickeadas
-- SELECT short_code, original_url, clicks FROM urls ORDER BY clicks DESC LIMIT 10;

-- Ver estadísticas de clicks por día
-- SELECT DATE(clicked_at) as date, COUNT(*) as clicks
-- FROM url_analytics
-- GROUP BY DATE(clicked_at)
-- ORDER BY date DESC;

-- Verificar que los triggers funcionan
-- SELECT * FROM urls WHERE short_code = 'google';
-- INSERT INTO url_analytics (url_id) VALUES ((SELECT id FROM urls WHERE short_code = 'google'));
-- SELECT * FROM urls WHERE short_code = 'google'; -- Debe tener clicks + 1
