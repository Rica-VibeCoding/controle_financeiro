/**
 * Script para aplicar migration de rate limit de convites
 *
 * Aplica as funções SQL necessárias para validação de rate limit no sistema de convites
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function aplicarMigration() {
  console.log('🚀 Iniciando aplicação da migration de rate limit...\n')

  // Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas')
    console.error('   Certifique-se que .env.local contém:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Criar cliente Supabase com service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Ler arquivo SQL
  const sqlPath = path.join(__dirname, '..', 'sql', 'rate-limit-convites.sql')

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Erro: Arquivo sql/rate-limit-convites.sql não encontrado')
    process.exit(1)
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8')
  console.log('✅ Arquivo SQL carregado:', sqlPath)
  console.log('📄 Tamanho:', sqlContent.length, 'caracteres\n')

  try {
    console.log('⚙️  Executando SQL no banco de dados...\n')

    // Executar SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: sqlContent
    })

    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente via postgres
      console.log('⚠️  Função exec_sql não disponível')
      console.log('📝 Tentando execução alternativa...\n')

      // Tentar criar as funções individualmente
      await executarSQLDireto(supabase, sqlContent)

    } else {
      console.log('✅ SQL executado com sucesso!\n')
      if (data) {
        console.log('📊 Resultado:', data)
      }
    }

    // Verificar se as funções foram criadas
    console.log('\n🔍 Verificando se as funções foram criadas...\n')
    await verificarFuncoes(supabase)

  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error.message)
    process.exit(1)
  }
}

async function executarSQLDireto(supabase, sqlContent) {
  // Dividir o SQL em statements individuais
  // Remover blocos de comentários e statements de teste
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.startsWith('--'))

  console.log(`📝 Executando ${statements.length} statements SQL...\n`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    // Pular comentários de bloco
    if (statement.trim().startsWith('/*') || statement.trim().length < 10) {
      continue
    }

    try {
      console.log(`  [${i + 1}/${statements.length}] Executando statement...`)

      // Usar uma query raw se disponível
      const { error } = await supabase.from('_sql_exec').insert({
        sql: statement
      })

      if (error && error.code !== 'PGRST116') {
        // Ignorar erro de tabela não encontrada
        console.warn(`  ⚠️  Aviso: ${error.message}`)
      }

    } catch (err) {
      console.warn(`  ⚠️  Statement ${i + 1} falhou:`, err.message)
    }
  }
}

async function verificarFuncoes(supabase) {
  try {
    // Verificar função contar_convites_ultimas_24h
    const { data: countFunc, error: countError } = await supabase
      .rpc('contar_convites_ultimas_24h', {
        p_workspace_id: '00000000-0000-0000-0000-000000000000' // UUID dummy para teste
      })

    if (countError) {
      console.log('❌ Função contar_convites_ultimas_24h: NÃO CRIADA')
      console.log('   Erro:', countError.message)
    } else {
      console.log('✅ Função contar_convites_ultimas_24h: OK')
    }

    // Verificar função pode_criar_convite
    const { data: canCreate, error: canCreateError } = await supabase
      .rpc('pode_criar_convite', {
        p_workspace_id: '00000000-0000-0000-0000-000000000000' // UUID dummy para teste
      })

    if (canCreateError) {
      console.log('❌ Função pode_criar_convite: NÃO CRIADA')
      console.log('   Erro:', canCreateError.message)
      console.log('\n⚠️  ATENÇÃO: As funções não foram criadas corretamente!')
      console.log('   Você precisará aplicar o SQL manualmente pelo Supabase Dashboard:')
      console.log('   https://supabase.com/dashboard/project/nzgifjdewdfibcopolof/sql')
    } else {
      console.log('✅ Função pode_criar_convite: OK')
      console.log('\n🎉 Migration aplicada com SUCESSO!')
      console.log('\n📊 Resultado da validação:', canCreate)
    }

  } catch (error) {
    console.error('❌ Erro ao verificar funções:', error.message)
  }
}

// Executar
aplicarMigration()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
