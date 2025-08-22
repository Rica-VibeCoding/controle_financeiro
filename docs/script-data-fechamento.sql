-- =====================================================
-- SCRIPT: Adicionar campo data_fechamento na tabela fp_contas
-- Data: 2025-08-21
-- Descrição: Campo para data de fechamento dos cartões de crédito
-- =====================================================

-- Adicionar coluna data_fechamento
ALTER TABLE fp_contas 
ADD COLUMN data_fechamento INTEGER;

-- Comentário para documentar o campo
COMMENT ON COLUMN fp_contas.data_fechamento IS 'Dia do mês que o cartão de crédito fecha (1-31). Aplicável apenas para tipo cartao_credito. Exemplo: 15 = fecha todo dia 15';

-- Verificar a estrutura atualizada
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'fp_contas' 
-- ORDER BY ordinal_position;

-- =====================================================
-- EXPLICAÇÃO DO CAMPO:
-- 
-- data_fechamento: INTEGER (1-31)
-- - Armazena apenas o DIA do mês (não data completa)
-- - Exemplo: 15 significa "todo dia 15 do mês"
-- - NULL para contas que não são cartão de crédito
-- - Será usado para calcular próximas faturas
-- =====================================================