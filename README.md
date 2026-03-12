# ImportCalc — China → Brasil

Calculadora inteligente de importação B2C. Calcule frete, tributos e viabilidade de qualquer produto importado da China.

## Como fazer o deploy no Vercel (5 minutos)

### Passo 1 — GitHub
1. Crie uma conta em github.com (se não tiver)
2. Crie um repositório novo chamado `importcalc`
3. Faça upload de todos os arquivos desta pasta

### Passo 2 — Vercel
1. Crie uma conta em vercel.com com sua conta do GitHub
2. Clique em "Add New Project"
3. Selecione o repositório `importcalc`
4. Clique em "Deploy"
5. Pronto! Seu site estará em `importcalc.vercel.app`

### Passo 3 — Domínio próprio (opcional)
No painel do Vercel, vá em Settings > Domains e adicione seu domínio.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:5173

## Build para produção

```bash
npm run build
```

Os arquivos ficam na pasta `dist/`.

## Tecnologias
- React 18
- Vite
- CSS puro (sem frameworks)
- Zero dependências externas
- Zero chamadas de API (100% local)
