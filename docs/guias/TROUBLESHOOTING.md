# 🔧 Troubleshooting - Resolução de Problemas

> **Soluções para problemas comuns do sistema**

---

## 🚨 Problemas de Produção

### Erro: Chunks JavaScript 404 / MIME types incorretos

**Sintomas:**
- Build funciona local, mas falha em produção
- Erros de MIME type no console
- Service Worker conflicts

**Solução:**
```bash
# 1. Limpar cache do navegador
# F12 > Application > Storage > Clear site data

# 2. Desregistrar Service Worker (console do browser)
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))

# 3. Deploy correto (sempre via GitHub)
git add .
git commit -m "correções produção"
git push origin main  # Vercel auto-deploy
```

**Prevenção:**
- ✅ Nunca use `vercel --prod` direto
- ✅ Sempre faça push para GitHub e deixe Vercel fazer auto-deploy
- ✅ Service Worker foi desabilitado temporariamente

---

## 🔐 Problemas de Autenticação

### Erro 406 ou "Workspace não encontrado"

**Causa:** Cache corrompido ou políticas RLS com deadlock

**Solução 1 - Limpar cache Next.js:**
```bash
# Windows
Remove-Item -Recurse -Force .next

# Linux/Mac
rm -rf .next

npm run dev
```

**Solução 2 - Limpar cache do navegador:**
1. Abrir DevTools (F12)
2. Application > Storage > Clear site data
3. Recarregar página

**Solução 3 - Modo dev (se habilitado):**
- Acesse: `http://172.19.112.1:3000/auth/dev`
- Apenas se `NEXT_PUBLIC_DEV_MODE=true`

---

## ⚡ Problemas de Performance

### Turbopack não funciona ou é lento

**Solução - Fallback para webpack:**
```bash
npm run dev
```

**Se persistir:**
```bash
# Limpar todos os caches
Remove-Item -Recurse -Force .next  # Windows
rm -rf .next                       # Linux/Mac
rm -rf node_modules/.cache
npm run dev --turbopack
```

---

## 📥 Problemas de Importação CSV

### Erro: "encoding inválido" ou "formato não reconhecido"

**Verificar encoding:**
```bash
file -I arquivo.csv  # Deve retornar: UTF-8
```

**Converter de ISO-8859-1 para UTF-8:**
```bash
iconv -f ISO-8859-1 -t UTF-8 arquivo.csv > arquivo_utf8.csv
```

**Verificar separador:**
```bash
head -1 arquivo.csv  # Deve ter vírgulas, não ponto-e-vírgula
```

---

## 📱 Problemas com PWA

### PWA não instala no celular

**Verificações obrigatórias:**

1. **HTTPS obrigatório** (localhost funciona em dev)

2. **Manifest válido:**
   ```bash
   curl http://localhost:3000/manifest.json
   ```

3. **Ícones existem:**
   ```bash
   ls -la public/icon-192.png
   ls -la public/icon-512.png
   ```

4. **Instalação no Chrome mobile:**
   - Menu > "Instalar app" ou "Adicionar à tela inicial"

---

## 💾 Problemas com Backup

### Exportação/importação trava no meio

**Verificar espaço em disco:**
```bash
df -h
```

**Verificar memória:**
```bash
free -h
```

**Para exports grandes (>1000 transações):**
- Use opção "Exportar por período" em vez de "Exportar tudo"

**Se importação falha:**
```bash
# Verificar se ZIP não está corrompido
unzip -t backup.zip
```

---

## 🐢 Dashboard Lento

### Cards demoram para carregar

**Solução 1 - Limpar cache SWR:**
1. DevTools > Application > Local Storage
2. Limpar dados do SWR

**Solução 2 - Verificar queries Supabase:**
- Dashboard > SQL Editor > Query performance
- Verificar se índices estão criados

**Solução 3 - Para muitas transações (>5000):**
- Use filtros de data para reduzir carga
- Dashboard carrega últimos 6 meses por padrão

---

## 🗃️ Problemas de Banco de Dados

### Erro ao executar migrations

**Solução:**
```bash
# Verificar se todas as tabelas fp_ existem
# No Supabase SQL Editor, execute:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'fp_%';
```

**Se faltarem tabelas:**
- Execute novamente o `docs/schema.sql` completo

---

## 🔍 Debug Avançado

### Debug Importação CSV

```typescript
// No console do browser (F12):
localStorage.setItem('debug-importacao', 'true');
// Recarregue e tente importar novamente
// Logs detalhados aparecerão no console
```

### Debug Sistema de Backup

```typescript
// Ativar logs detalhados:
localStorage.setItem('debug-backup', 'true');
// Exportação mostrará progress detalhado
```

### Debug PWA

1. Chrome DevTools > Application > Manifest
   - Verifica se manifest está válido

2. Chrome DevTools > Application > Service Workers
   - (Futuro: quando implementarmos cache offline)

3. Lighthouse > PWA section
   - Score deve ser >80 para boa experiência

---

## 🚫 Erros de Build

### Build falha no Vercel

**Causa comum:** Variáveis/imports não usados

**Solução:**
```bash
# Validar TypeScript ANTES de fazer push
npx tsc --noEmit

# Rodar linter
npm run lint

# Build local para testar
npm run build
```

**Regra de ouro:**
- ✅ SEMPRE valide antes de fazer commit
- ✅ NUNCA deixe variáveis não usadas
- ✅ NUNCA deixe imports não utilizados

---

## 🔄 Problemas de Sincronização

### Dados não atualizam entre abas

**Causa:** Cache SWR não está revalidando

**Solução:**
```typescript
// Forçar revalidação manual
mutate('/api/endpoint')

// Ou limpar cache completamente
localStorage.clear()
sessionStorage.clear()
```

---

## 🆘 Quando Nada Funciona

### Reset Completo

```bash
# 1. Parar servidor
# Ctrl + C

# 2. Limpar tudo
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 3. Reinstalar
npm install

# 4. Limpar cache browser
# F12 > Application > Storage > Clear site data

# 5. Reiniciar
npm run dev --turbopack
```

---

## 📞 Suporte Adicional

Se o problema persistir:

1. **Verificar logs Supabase:**
   - Dashboard > Logs > API / Postgres

2. **Verificar console do browser:**
   - F12 > Console (erros em vermelho)

3. **Verificar terminal:**
   - Erros durante `npm run dev`

4. **Documentação específica:**
   - [Funcionalidades](../funcionalidades/) - Docs detalhadas de cada feature

---

## 🔗 Links Úteis

- **[Comandos](COMANDOS.md)** - Referência de comandos
- **[Instalação](INSTALACAO-COMPLETA.md)** - Setup completo
- **[← Voltar ao índice](../README.txt)**
