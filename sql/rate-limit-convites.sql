-- =====================================================
-- RATE LIMIT FOR INVITE CREATION
-- Financial Control System - Multi-Workspace
-- Date: 2025-10-23
-- =====================================================
-- Purpose: Prevent abuse of invite creation system
-- Limit: 50 invites per workspace every 24 hours
-- =====================================================

-- =====================================================
-- FUNCTION: Count invites created in last 24 hours
-- =====================================================

CREATE OR REPLACE FUNCTION public.contar_convites_ultimas_24h(
  p_workspace_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_limite_temporal TIMESTAMPTZ;
BEGIN
  -- Calculate timestamp 24 hours ago
  v_limite_temporal := NOW() - INTERVAL '24 hours';

  -- Count invites created after that timestamp
  SELECT COUNT(*)
  INTO v_count
  FROM public.fp_convites_links
  WHERE workspace_id = p_workspace_id
    AND created_at >= v_limite_temporal;

  -- Return count
  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.contar_convites_ultimas_24h(UUID) IS
'Counts how many invites were created by a workspace in the last 24 hours.
Used to implement rate limiting of 50 invites/day.
Returns: integer with the count.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.contar_convites_ultimas_24h(UUID) TO authenticated;

-- =====================================================
-- FUNCTION: Validate if workspace can create invite
-- =====================================================

CREATE OR REPLACE FUNCTION public.pode_criar_convite(
  p_workspace_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_limite CONSTANT INTEGER := 50; -- Maximum invites per 24h
BEGIN
  -- Count recent invites
  SELECT public.contar_convites_ultimas_24h(p_workspace_id)
  INTO v_count;

  -- Check if exceeded limit
  IF v_count >= v_limite THEN
    RETURN jsonb_build_object(
      'permitido', FALSE,
      'motivo', 'Limite de ' || v_limite || ' convites por dia atingido',
      'convites_criados', v_count,
      'limite_maximo', v_limite
    );
  END IF;

  -- Within limit
  RETURN jsonb_build_object(
    'permitido', TRUE,
    'convites_criados', v_count,
    'convites_restantes', v_limite - v_count,
    'limite_maximo', v_limite
  );
END;
$$;

COMMENT ON FUNCTION public.pode_criar_convite(UUID) IS
'Validates if a workspace can create a new invite based on rate limit.
Limit: 50 invites every 24 hours.
Returns JSONB with: {permitido: boolean, motivo?: string, convites_criados: number}';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.pode_criar_convite(UUID) TO authenticated;

-- =====================================================
-- PERFORMANCE INDEX
-- =====================================================

-- Drop existing index if it exists (for clean re-creation)
DROP INDEX IF EXISTS idx_convites_rate_limit;

-- Create composite index for rate limit optimization
-- Pattern: workspace_id + created_at DESC
CREATE INDEX idx_convites_rate_limit
ON public.fp_convites_links (workspace_id, created_at DESC);

COMMENT ON INDEX public.idx_convites_rate_limit IS
'Composite index to optimize rate limiting queries (invite count by workspace in last 24h).
Columns: workspace_id + created_at (descending order).';

-- =====================================================
-- VALIDATION TESTS
-- =====================================================

-- Test 1: Verify functions were created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'contar_convites_ultimas_24h'
  ) THEN
    RAISE EXCEPTION 'Function contar_convites_ultimas_24h was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'pode_criar_convite'
  ) THEN
    RAISE EXCEPTION 'Function pode_criar_convite was not created';
  END IF;

  RAISE NOTICE 'SUCCESS: All functions created successfully';
END $$;

-- Test 2: Verify index was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'fp_convites_links'
      AND indexname = 'idx_convites_rate_limit'
  ) THEN
    RAISE EXCEPTION 'Index idx_convites_rate_limit was not created';
  END IF;

  RAISE NOTICE 'SUCCESS: Index created successfully';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
