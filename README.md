# ImportCalc V2 — China → Brasil
## Com fretes reais da Hubbuycn

---

## Deploy no Vercel (10 minutos)

### Passo 1 — GitHub
1. Abra seu repositório GitHub atual (`importcalc`)
2. Delete todos os arquivos antigos
3. Faça upload de todos os arquivos desta pasta (sem subpasta)

### Passo 2 — Variáveis de Ambiente no Vercel
Esta é a parte mais importante. Sem isso os fretes reais não funcionam.

1. Abra o painel do Vercel → seu projeto
2. Clique em **Settings** → **Environment Variables**
3. Adicione estas duas variáveis:

| Nome | Valor |
|------|-------|
| `HUBBUYCN_EMAIL` | seu email de login na Hubbuycn |
| `HUBBUYCN_PASSWORD` | sua senha da Hubbuycn |

4. Clique em **Save**
5. Vá em **Deployments** → clique nos 3 pontos → **Redeploy**

### Passo 3 — Pronto!
O site vai buscar fretes reais automaticamente. O login é feito em segundo plano, invisível para o usuário.

---

## Como funciona por baixo

```
Usuário preenche formulário
    ↓
Frontend chama /api/frete (Vercel Function)
    ↓
Vercel Function loga na Hubbuycn com suas credenciais
    ↓
Pega JWT token (renovado automaticamente)
    ↓
Chama calculateDeliveryFee com peso e dimensões
    ↓
Retorna rotas reais com preços para o frontend
```

As credenciais ficam seguras nas variáveis de ambiente do Vercel — nunca aparecem no código ou no navegador.

---

## Rodar localmente

Crie um arquivo `.env.local` na raiz:
```
HUBBUYCN_EMAIL=seu@email.com
HUBBUYCN_PASSWORD=suasenha
```

Depois:
```bash
npm install
npm run dev
```
