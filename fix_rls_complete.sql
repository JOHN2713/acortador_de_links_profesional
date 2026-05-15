-- =====================================================
-- DIAGNÓSTICO Y CORRECCIÓN COMPLETA DE RLS
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor
-- =====================================================

-- PASO 1: Ver TODAS las políticas actuales de la tabla urls
SELECT 
    policyname,
    cmd,
    qual::text as using_expression,
    with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'urls'
ORDER BY cmd;

-- =====================================================
-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS RESTRICTIVAS
-- =====================================================

-- Eliminar cualquier política de UPDATE anterior
DROP POLICY IF EXISTS "Permitir actualización de contador por trigger" ON urls;
DROP POLICY IF EXISTS "Permitir actualización completa de URLs" ON urls;
DROP POLICY IF EXISTS "Users can update their own urls" ON urls;
DROP POLICY IF EXISTS "Enable update for all users" ON urls;

-- =====================================================
-- PASO 3: CREAR POLÍTICA PERMISIVA PARA UPDATE
-- =====================================================

-- Esta política permite UPDATE sin restricciones
CREATE POLICY "Allow all updates on urls"
    ON urls
    FOR UPDATE
    TO public
    USING (TRUE)
    WITH CHECK (TRUE);

-- =====================================================
-- PASO 4: VERIFICAR POLÍTICAS DE SELECT, INSERT, DELETE
-- =====================================================

-- Asegurarnos que SELECT esté permitido
DO $$
BEGIN
    -- Eliminar políticas SELECT anteriores si existen
    DROP POLICY IF EXISTS "Enable select for all users" ON urls;
    DROP POLICY IF EXISTS "Allow all selects on urls" ON urls;
    
    -- Crear política SELECT permisiva
    CREATE POLICY "Allow all selects on urls"
        ON urls
        FOR SELECT
        TO public
        USING (TRUE);
END $$;

-- =====================================================
-- PASO 5: VERIFICAR RESULTADO
-- =====================================================

-- Mostrar políticas finales
SELECT 
    policyname,
    cmd,
    qual::text as using_expression,
    with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'urls'
ORDER BY cmd;

-- =====================================================
-- PASO 6: PRUEBA DE UPDATE
-- =====================================================

-- Obtener el ID de una URL de prueba
DO $$
DECLARE
    test_url_id UUID;
    old_active BOOLEAN;
    new_active BOOLEAN;
BEGIN
    -- Seleccionar una URL activa
    SELECT id INTO test_url_id 
    FROM urls 
    WHERE is_active = TRUE 
    LIMIT 1;
    
    IF test_url_id IS NULL THEN
        RAISE NOTICE 'No hay URLs activas para probar';
    ELSE
        RAISE NOTICE 'Probando con URL ID: %', test_url_id;
        
        -- Guardar estado actual
        SELECT is_active INTO old_active 
        FROM urls 
        WHERE id = test_url_id;
        
        -- Intentar cambiar is_active
        UPDATE urls 
        SET is_active = FALSE 
        WHERE id = test_url_id;
        
        -- Verificar cambio
        SELECT is_active INTO new_active 
        FROM urls 
        WHERE id = test_url_id;
        
        RAISE NOTICE 'Estado anterior: %, Estado nuevo: %', old_active, new_active;
        
        -- Restaurar estado original
        UPDATE urls 
        SET is_active = old_active 
        WHERE id = test_url_id;
        
        IF new_active = FALSE THEN
            RAISE NOTICE '✅ ÉXITO: El UPDATE funciona correctamente';
        ELSE
            RAISE NOTICE '❌ ERROR: El UPDATE sigue bloqueado';
        END IF;
    END IF;
END $$;

-- =====================================================
-- INFORMACIÓN ADICIONAL
-- =====================================================

-- Verificar que RLS esté habilitado
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'urls';

-- Si RLS está causando problemas, puedes deshabilitarlo temporalmente
-- (NO RECOMENDADO EN PRODUCCIÓN):
-- ALTER TABLE urls DISABLE ROW LEVEL SECURITY;
