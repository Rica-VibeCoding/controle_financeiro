-- Atualizar centros de custo que não têm cor definida
-- Adiciona cores padrão aos centros existentes

UPDATE fp_centros_custo 
SET cor = '#3B82F6' 
WHERE cor IS NULL OR cor = '';

-- Adicionar cores variadas aos centros existentes para melhor visualização
-- Casa - Verde
UPDATE fp_centros_custo 
SET cor = '#10B981' 
WHERE nome ILIKE '%casa%' AND (cor IS NULL OR cor = '' OR cor = '#3B82F6');

-- Trabalho - Azul escuro  
UPDATE fp_centros_custo 
SET cor = '#1E40AF' 
WHERE nome ILIKE '%trabalho%' AND (cor IS NULL OR cor = '' OR cor = '#3B82F6');

-- Pessoal - Roxo
UPDATE fp_centros_custo 
SET cor = '#8B5CF6' 
WHERE nome ILIKE '%pessoal%' AND (cor IS NULL OR cor = '' OR cor = '#3B82F6');

-- Viagem - Laranja
UPDATE fp_centros_custo 
SET cor = '#F97316' 
WHERE nome ILIKE '%viagem%' AND (cor IS NULL OR cor = '' OR cor = '#3B82F6');

-- Família - Rosa
UPDATE fp_centros_custo 
SET cor = '#EC4899' 
WHERE nome ILIKE '%familia%' OR nome ILIKE '%família%' AND (cor IS NULL OR cor = '' OR cor = '#3B82F6');