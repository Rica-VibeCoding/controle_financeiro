-- Função para calcular saldos de todas as contas de uma vez
-- Resolve o problema N+1 do arquivo contas.ts

CREATE OR REPLACE FUNCTION calcular_saldos_contas()
RETURNS TABLE (
  conta_id UUID,
  saldo DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH saldos_base AS (
    -- Transações normais (receitas/despesas)
    SELECT 
      t.conta_id,
      SUM(
        CASE 
          WHEN t.tipo = 'receita' THEN t.valor
          WHEN t.tipo = 'despesa' THEN -t.valor
          ELSE 0
        END
      ) as saldo_transacoes
    FROM fp_transacoes t
    WHERE t.status = 'realizado'
      AND t.tipo IN ('receita', 'despesa')
    GROUP BY t.conta_id
  ),
  transferencias_recebidas AS (
    -- Transferências recebidas (conta destino)
    SELECT 
      t.conta_destino_id as conta_id,
      SUM(t.valor) as valor_recebido
    FROM fp_transacoes t
    WHERE t.status = 'realizado'
      AND t.tipo = 'transferencia'
      AND t.conta_destino_id IS NOT NULL
    GROUP BY t.conta_destino_id
  ),
  transferencias_enviadas AS (
    -- Transferências enviadas (conta origem)
    SELECT 
      t.conta_id,
      SUM(t.valor) as valor_enviado
    FROM fp_transacoes t
    WHERE t.status = 'realizado'
      AND t.tipo = 'transferencia'
    GROUP BY t.conta_id
  ),
  todas_contas AS (
    -- Garantir que todas as contas apareçam no resultado
    SELECT id as conta_id FROM fp_contas WHERE ativo = true
  )
  SELECT 
    tc.conta_id,
    COALESCE(sb.saldo_transacoes, 0) + 
    COALESCE(tr.valor_recebido, 0) - 
    COALESCE(te.valor_enviado, 0) as saldo
  FROM todas_contas tc
  LEFT JOIN saldos_base sb ON tc.conta_id = sb.conta_id
  LEFT JOIN transferencias_recebidas tr ON tc.conta_id = tr.conta_id
  LEFT JOIN transferencias_enviadas te ON tc.conta_id = te.conta_id;
END;
$$ LANGUAGE plpgsql;