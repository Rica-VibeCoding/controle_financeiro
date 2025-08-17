-- =====================================================
-- SCHEMA FINANÇAS PESSOAIS - SUPABASE
-- Prefixo: fp_ (finanças pessoais)
-- Autor: Sistema de Controle Financeiro
-- Data: 2025
-- =====================================================

-- =====================================================
-- 1. TABELAS DE APOIO (DIMENSÕES)
-- =====================================================

-- Categorias principais
CREATE TABLE fp_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  tipo TEXT CHECK (tipo IN ('receita', 'despesa', 'ambos')) NOT NULL,
  icone TEXT DEFAULT 'circle',
  cor TEXT DEFAULT '#6B7280',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subcategorias (relacionadas às categorias)
CREATE TABLE fp_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES fp_categorias(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nome, categoria_id)
);

-- Contas bancárias/cartões/dinheiro
CREATE TABLE fp_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'conta_corrente', 'poupanca', 'cartao_credito', 'dinheiro'
  banco TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Formas de pagamento
CREATE TABLE fp_formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL, -- 'vista', 'credito', 'debito'
  permite_parcelamento BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Centros de custo/projetos
CREATE TABLE fp_centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  cor TEXT DEFAULT '#6B7280',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA PRINCIPAL - TRANSAÇÕES
-- =====================================================

CREATE TABLE fp_transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  
  -- Relacionamentos opcionais
  categoria_id UUID REFERENCES fp_categorias(id),
  subcategoria_id UUID REFERENCES fp_subcategorias(id),
  forma_pagamento_id UUID REFERENCES fp_formas_pagamento(id),
  centro_custo_id UUID REFERENCES fp_centros_custo(id),
  
  -- Valores e tipo
  valor DECIMAL(10,2) NOT NULL, -- Máximo: R$ 99.999.999,99
  tipo TEXT CHECK (tipo IN ('receita', 'despesa', 'transferencia')) NOT NULL,
  
  -- Contas (origem obrigatória, destino só para transferências)
  conta_id UUID REFERENCES fp_contas(id) NOT NULL,
  conta_destino_id UUID REFERENCES fp_contas(id), -- Apenas para transferências
  
  -- Parcelamento
  parcela_atual INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  grupo_parcelamento BIGINT, -- ID para agrupar parcelas (suporta Date.now())
  
  -- Recorrência
  recorrente BOOLEAN DEFAULT false,
  frequencia_recorrencia TEXT, -- 'mensal', 'semanal', 'anual', 'diario'
  proxima_recorrencia DATE, -- Quando gerar próxima transação
  
  -- Status e datas
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  data_vencimento DATE,
  data_registro TIMESTAMP DEFAULT NOW(),
  
  -- Anexos e observações
  anexo_url TEXT, -- URL do Supabase Storage
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA DE METAS
-- =====================================================

CREATE TABLE fp_metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- Relacionamentos
  categoria_id UUID REFERENCES fp_categorias(id), -- NULL = meta total
  
  -- Valores e período
  valor_limite DECIMAL(10,2) NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  
  -- Tipo de meta
  tipo TEXT CHECK (tipo IN ('categoria', 'total')) DEFAULT 'categoria',
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_fp_transacoes_updated_at 
    BEFORE UPDATE ON fp_transacoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fp_metas_updated_at 
    BEFORE UPDATE ON fp_metas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices em transações (tabela mais consultada)
CREATE INDEX idx_fp_transacoes_data ON fp_transacoes(data);
CREATE INDEX idx_fp_transacoes_conta ON fp_transacoes(conta_id);
CREATE INDEX idx_fp_transacoes_categoria ON fp_transacoes(categoria_id);
CREATE INDEX idx_fp_transacoes_tipo ON fp_transacoes(tipo);
CREATE INDEX idx_fp_transacoes_status ON fp_transacoes(status);
CREATE INDEX idx_fp_transacoes_recorrente ON fp_transacoes(recorrente);
CREATE INDEX idx_fp_transacoes_grupo_parcelamento ON fp_transacoes(grupo_parcelamento);

-- Índices em metas
CREATE INDEX idx_fp_metas_categoria ON fp_metas(categoria_id);
CREATE INDEX idx_fp_metas_periodo ON fp_metas(periodo_inicio, periodo_fim);
CREATE INDEX idx_fp_metas_ativo ON fp_metas(ativo);

-- =====================================================
-- 6. CONFIGURAÇÃO STORAGE (ANEXOS)
-- =====================================================

-- Criar bucket para anexos de transações
INSERT INTO storage.buckets (id, name, public) VALUES ('anexos-transacoes', 'anexos-transacoes', true);

-- Política para permitir upload de anexos
CREATE POLICY "Permitir upload de anexos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'anexos-transacoes');

-- Política para permitir leitura de anexos
CREATE POLICY "Permitir leitura de anexos" ON storage.objects
FOR SELECT USING (bucket_id = 'anexos-transacoes');

-- Política para permitir exclusão de anexos
CREATE POLICY "Permitir exclusão de anexos" ON storage.objects
FOR DELETE USING (bucket_id = 'anexos-transacoes');

-- =====================================================
-- 7. DADOS INICIAIS - CATEGORIAS BRASILEIRAS
-- =====================================================

INSERT INTO fp_categorias (nome, tipo, icone, cor) VALUES
-- Receitas
('Salário', 'receita', 'dollar-sign', '#10B981'),
('Freelance', 'receita', 'briefcase', '#059669'),
('Investimentos', 'receita', 'trending-up', '#047857'),
('Vendas', 'receita', 'shopping-bag', '#065F46'),
('Outros', 'receita', 'plus-circle', '#064E3B'),

-- Despesas
('Alimentação', 'despesa', 'utensils', '#EF4444'),
('Transporte', 'despesa', 'car', '#F97316'),
('Moradia', 'despesa', 'home', '#8B5CF6'),
('Saúde', 'despesa', 'heart', '#EC4899'),
('Educação', 'despesa', 'book-open', '#3B82F6'),
('Lazer', 'despesa', 'gamepad-2', '#6366F1'),
('Vestuário', 'despesa', 'shirt', '#14B8A6'),
('Tecnologia', 'despesa', 'smartphone', '#6B7280'),
('Serviços', 'despesa', 'settings', '#9CA3AF'),
('Impostos', 'despesa', 'file-text', '#F59E0B');

-- =====================================================
-- 8. DADOS INICIAIS - SUBCATEGORIAS
-- =====================================================

-- Subcategorias de Alimentação
INSERT INTO fp_subcategorias (nome, categoria_id) VALUES
('Supermercado', (SELECT id FROM fp_categorias WHERE nome = 'Alimentação')),
('Restaurante', (SELECT id FROM fp_categorias WHERE nome = 'Alimentação')),
('Delivery', (SELECT id FROM fp_categorias WHERE nome = 'Alimentação')),
('Lanchonete', (SELECT id FROM fp_categorias WHERE nome = 'Alimentação')),
('Padaria', (SELECT id FROM fp_categorias WHERE nome = 'Alimentação'));

-- Subcategorias de Transporte
INSERT INTO fp_subcategorias (nome, categoria_id) VALUES
('Combustível', (SELECT id FROM fp_categorias WHERE nome = 'Transporte')),
('Uber/99', (SELECT id FROM fp_categorias WHERE nome = 'Transporte')),
('Ônibus', (SELECT id FROM fp_categorias WHERE nome = 'Transporte')),
('Metrô', (SELECT id FROM fp_categorias WHERE nome = 'Transporte')),
('Estacionamento', (SELECT id FROM fp_categorias WHERE nome = 'Transporte')),
('Manutenção', (SELECT id FROM fp_categorias WHERE nome = 'Transporte'));

-- Subcategorias de Moradia
INSERT INTO fp_subcategorias (nome, categoria_id) VALUES
('Aluguel', (SELECT id FROM fp_categorias WHERE nome = 'Moradia')),
('Energia Elétrica', (SELECT id FROM fp_categorias WHERE nome = 'Moradia')),
('Água', (SELECT id FROM fp_categorias WHERE nome = 'Moradia')),
('Internet', (SELECT id FROM fp_categorias WHERE nome = 'Moradia')),
('Gás', (SELECT id FROM fp_categorias WHERE nome = 'Moradia')),
('Condomínio', (SELECT id FROM fp_categorias WHERE nome = 'Moradia')),
('Móveis', (SELECT id FROM fp_categorias WHERE nome = 'Moradia')),
('Decoração', (SELECT id FROM fp_categorias WHERE nome = 'Moradia'));

-- Subcategorias de Lazer
INSERT INTO fp_subcategorias (nome, categoria_id) VALUES
('Cinema', (SELECT id FROM fp_categorias WHERE nome = 'Lazer')),
('Streaming', (SELECT id FROM fp_categorias WHERE nome = 'Lazer')),
('Viagem', (SELECT id FROM fp_categorias WHERE nome = 'Lazer')),
('Academia', (SELECT id FROM fp_categorias WHERE nome = 'Lazer')),
('Jogos', (SELECT id FROM fp_categorias WHERE nome = 'Lazer')),
('Eventos', (SELECT id FROM fp_categorias WHERE nome = 'Lazer'));

-- =====================================================
-- 9. DADOS INICIAIS - FORMAS DE PAGAMENTO
-- =====================================================

INSERT INTO fp_formas_pagamento (nome, tipo, permite_parcelamento) VALUES
('Dinheiro', 'vista', false),
('PIX', 'vista', false),
('Débito', 'debito', false),
('Crédito', 'credito', true),
('Boleto', 'vista', false),
('TED/DOC', 'vista', false),
('Cartão Pré-pago', 'debito', false);

-- =====================================================
-- 10. DADOS INICIAIS - CENTROS DE CUSTO
-- =====================================================

INSERT INTO fp_centros_custo (nome, descricao, cor) VALUES
('Pessoal', 'Gastos pessoais e família', '#3B82F6'),
('Casa', 'Despesas da casa e moradia', '#10B981'),
('Trabalho', 'Gastos relacionados ao trabalho', '#F59E0B'),
('Negócio', 'Despesas empresariais', '#8B5CF6'),
('Emergência', 'Gastos não planejados', '#EF4444');

-- =====================================================
-- 11. DADOS INICIAIS - CONTAS EXEMPLO
-- =====================================================

INSERT INTO fp_contas (nome, tipo, banco) VALUES
('Carteira', 'dinheiro', NULL),
('Nubank', 'conta_corrente', 'Nubank'),
('Itaú CC', 'conta_corrente', 'Itaú'),
('Poupança', 'poupanca', 'Itaú'),
('Cartão Nubank', 'cartao_credito', 'Nubank'),
('Cartão Itaú', 'cartao_credito', 'Itaú');

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Para verificar a criação das tabelas:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'fp_%';

-- Para verificar dados iniciais:
-- SELECT COUNT(*) as total_categorias FROM fp_categorias;
-- SELECT COUNT(*) as total_subcategorias FROM fp_subcategorias;
-- SELECT COUNT(*) as total_formas_pagamento FROM fp_formas_pagamento;