// ── DESCRIÇÕES ADUANEIRAS ─────────────────────────────────────────────────
export const DESCRICOES = {
  luminaria: {
    metal: "decorative metal table lamp",
    bronze: "decorative bronze lamp",
    vidro: "decorative glass lamp",
    plastico: "decorative plastic lamp",
    ceramica: "decorative ceramic lamp",
    misto: "decorative table lamp",
    default: "decorative table lamp"
  },
  decoracao: {
    metal: "decorative metal figurine",
    bronze: "decorative bronze figurine",
    vidro: "decorative glass ornament",
    ceramica: "decorative ceramic ornament",
    madeira: "decorative wooden ornament",
    default: "decorative ornament"
  },
  quadro:     { default: "decorative wall art panel" },
  eletronico: { metal: "decorative metal clock", plastico: "decorative plastic clock", default: "decorative clock" },
  prato:      { metal: "decorative metal souvenir plate", bronze: "decorative bronze souvenir plate", ceramica: "decorative ceramic plate", default: "decorative souvenir plate" },
  movel:      { metal: "metal furniture frame parts", default: "furniture frame parts" },
  outro:      { default: "decorative household item" }
}

export function getDescricao(cat, mat) {
  const c = DESCRICOES[cat] || DESCRICOES.outro
  return c[mat] || c.default
}

// ── ROTAS ─────────────────────────────────────────────────────────────────
export const ROTAS = [
  { nome: 'YX-BR-line',     tipo: 'real', dias: '15-25', batOk: false, base: 38, extra: 21 },
  { nome: 'FJ-BR-line-D',   tipo: 'real', dias: '8-12',  batOk: true,  base: 42, extra: 24 },
  { nome: 'TYG-BR-Line-F',  tipo: 8000,  dias: '25-35', batOk: false, base: 35, extra: 19 },
  { nome: 'JYTD-BR-line-D', tipo: 6000,  dias: '10-18', batOk: true,  base: 40, extra: 22 },
  { nome: 'EUB (DDP)',      tipo: 'real', dias: '15-25', batOk: true,  base: 38, extra: 22, taxa: 3 },
]

export function calcRotas(P, vol6, vol8, CB) {
  return ROTAS.map(r => {
    const pf = r.tipo === 'real' ? P : Math.max(P, r.tipo === 6000 ? vol6 : vol8)
    const usd = Math.max(
      (pf <= 0.7 ? r.base * pf : r.base * 0.7 + r.extra * (pf - 0.7)) + (r.taxa || 0),
      14
    )
    return { ...r, pesoFat: pf, freteUSD: usd, freteBRL: usd * CB }
  })
}

// ── TRIBUTOS ──────────────────────────────────────────────────────────────
export function calcTributos(vd, CB) {
  const base = vd * CB
  const fed = base * 0.20
  const icms = (base + fed) * (17 / 83)
  return { fed, icms, total: fed + icms }
}

export function valorIdealDeclarar(V) {
  if (V <= 10) return Math.max(V * 0.6, 4)
  if (V <= 20) return V * 0.55
  if (V <= 40) return V * 0.50
  return Math.min(V * 0.45, 45)
}

// ── ANÁLISE INTELIGENTE ───────────────────────────────────────────────────
export function gerarAnalise({ nome, categoria, material, desmonta, bateria, rel, melhor, P, vol8, vd, V, landed, trib, CB }) {
  const secoes = []
  const domVol = vol8 > P

  // Descrição
  secoes.push({
    titulo: "🏷 Descrição Aduaneira",
    cor: "var(--accent)",
    linhas: [
      `Use: "${getDescricao(categoria, material)}"`,
      `Evite: nomes de marca, "vintage", "retro", "luxury", "chrome", "crystal".`,
      `Declare $${vd.toFixed(0)} USD — regime 20% (abaixo de $50).`
    ]
  })

  // Viabilidade
  let viabLinhas, viabCor
  if (rel < 1.8) {
    viabCor = "var(--green)"
    viabLinhas = [`Excelente custo-benefício — landed cost é ${rel.toFixed(1)}× o valor pago.`, `R$${landed.toFixed(0)} total para produto de R$${(V * CB).toFixed(0)}. Vale muito a pena.`]
  } else if (rel < 2.5) {
    viabCor = "var(--yellow)"
    viabLinhas = [`Viável, mas frete pesa. Custo total é ${rel.toFixed(1)}× o valor pago.`, `R$${landed.toFixed(0)} total. Avalie se o produto é exclusivo ou difícil de encontrar no Brasil.`]
  } else if (rel < 3.5) {
    viabCor = "var(--yellow)"
    viabLinhas = [`Frete alto — custo é ${rel.toFixed(1)}× o valor pago.`, `Considere consolidar com outros produtos no mesmo envio para diluir o frete.`]
  } else {
    viabCor = "var(--red)"
    viabLinhas = [`Frete desproporcional — ${rel.toFixed(1)}× o valor pago.`, `R$${melhor.freteBRL.toFixed(0)} de frete para produto de R$${(V * CB).toFixed(0)}. Só vale se for item muito especial.`]
  }
  secoes.push({ titulo: "💰 Viabilidade", cor: viabCor, linhas: viabLinhas })

  // Embalagem
  const embLinhas = []
  if (domVol) {
    embLinhas.push(`Volumétrico (${vol8.toFixed(2)}kg) domina sobre peso real (${P.toFixed(2)}kg) — caixa grande demais.`)
    if (desmonta === 'sim') embLinhas.push("✓ Produto desmontável: peça reembalagem compacta à Hubbuycn antes do envio.")
    else if (desmonta === 'parcial') embLinhas.push("✓ Desmontagem parcial possível: solicite redução máxima da caixa.")
    else embLinhas.push("Solicite embalagem mínima com plástico bolha — descarte a caixa original.")
  } else {
    embLinhas.push(`Peso real (${P.toFixed(2)}kg) domina — produto denso. Rota peso real é ideal.`)
    embLinhas.push("Foque em proteção com bolha. Compactar a caixa não reduz frete nesse caso.")
  }
  secoes.push({ titulo: "📦 Embalagem", cor: "var(--blue)", linhas: embLinhas })

  // Rota
  const rotaLinhas = [
    `Melhor opção: ${melhor.nome} — ${melhor.dias} dias úteis.`,
    `Frete estimado: R$${melhor.freteBRL.toFixed(0)} (≈ $${melhor.freteUSD.toFixed(0)} USD).`
  ]
  if (bateria !== 'nao' && !melhor.batOk) rotaLinhas.push("⚠ Essa rota pode não aceitar bateria — confirme na Hubbuycn.")
  if (melhor.nome === 'EUB (DDP)') rotaLinhas.push("EUB DDP: tributos pagos antecipadamente com coeficiente 1,28 + R$17,40 Correios.")
  secoes.push({ titulo: "🚚 Rota Recomendada", cor: "var(--blue)", linhas: rotaLinhas })

  // Alertas
  const alertas = []
  if (bateria !== 'nao') alertas.push("Produto com bateria — confirme aceitação na rota escolhida.")
  if (material === 'vidro') alertas.push("Vidro frágil — solicite bolha dupla e caixa rígida.")
  if (material === 'marmore') alertas.push("Mármore muito pesado — remova a base para reduzir peso/frete.")
  if (categoria === 'quadro') alertas.push("Quadros têm volumétrico alto — envie em lote para diluir frete.")
  if (P > 4) alertas.push(`Produto pesado (${P.toFixed(2)}kg) — verifique limite de peso da rota.`)
  if (V > 45) alertas.push("Valor pago alto — declare conservador para ficar abaixo de $50 (regime 20%).")
  if (nome.toLowerCase().includes('vintage') || nome.toLowerCase().includes('retro')) {
    alertas.push("Nome contém palavras premium — não use 'vintage' ou 'retro' na declaração.")
  }
  if (alertas.length === 0) alertas.push("Nenhum alerta crítico para esse produto.")
  secoes.push({ titulo: "⚠ Alertas", cor: "var(--yellow)", linhas: alertas })

  return secoes
}
