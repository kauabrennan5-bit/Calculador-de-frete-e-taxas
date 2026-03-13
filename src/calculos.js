// Descrições aduaneiras recomendadas
export const DESCRICOES = {
  luminaria: { metal:"decorative metal table lamp", bronze:"decorative bronze lamp", vidro:"decorative glass lamp", plastico:"decorative plastic lamp", ceramica:"decorative ceramic lamp", misto:"decorative table lamp", default:"decorative table lamp" },
  decoracao: { metal:"decorative metal figurine", bronze:"decorative bronze figurine", vidro:"decorative glass ornament", ceramica:"decorative ceramic ornament", madeira:"decorative wooden ornament", default:"decorative ornament" },
  quadro:    { default:"decorative wall art panel" },
  eletronico:{ metal:"decorative metal clock", plastico:"decorative plastic clock", default:"decorative clock" },
  prato:     { metal:"decorative metal souvenir plate", bronze:"decorative bronze souvenir plate", ceramica:"decorative ceramic plate", default:"decorative souvenir plate" },
  movel:     { metal:"metal furniture frame parts", default:"furniture frame parts" },
  outro:     { default:"decorative household item" }
}

export function getDescricao(cat, mat) {
  const c = DESCRICOES[cat] || DESCRICOES.outro
  return c[mat] || c.default
}

// productTypeId da Hubbuycn baseado em bateria
export function getProductTypeId(bateria) {
  if (bateria === 'interna' || bateria === 'externa') return 3 // Battery
  return 1 // General Goods
}

// Tributos
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

// Análise inteligente local
export function gerarAnalise({ nome, categoria, material, desmonta, bateria, rel, melhor, P, vol8, vd, V, landed, trib, CB }) {
  const secoes = []
  const domVol = vol8 > P

  // Viabilidade
  let viabLinhas, viabCor
  if (rel < 1.8) {
    viabCor = "var(--green)"
    viabLinhas = [`Excelente custo-benefício — landed cost é ${rel.toFixed(1)}× o valor pago.`, `R$${landed.toFixed(0)} total para produto de R$${(V*CB).toFixed(0)}. Vale muito a pena.`]
  } else if (rel < 2.5) {
    viabCor = "var(--yellow)"
    viabLinhas = [`Viável, mas frete pesa. Custo total é ${rel.toFixed(1)}× o valor pago.`, `Avalie se o produto é exclusivo ou difícil de encontrar no Brasil.`]
  } else if (rel < 3.5) {
    viabCor = "var(--yellow)"
    viabLinhas = [`Frete alto — custo é ${rel.toFixed(1)}× o valor pago.`, `Considere consolidar com outros produtos no mesmo envio.`]
  } else {
    viabCor = "var(--red)"
    viabLinhas = [`Frete desproporcional — ${rel.toFixed(1)}× o valor pago.`, `Só vale se o item for muito especial ou exclusivo.`]
  }
  secoes.push({ titulo: "💰 Viabilidade", cor: viabCor, linhas: viabLinhas })

  // Embalagem
  const embLinhas = []
  if (domVol) {
    embLinhas.push(`Volumétrico (${vol8.toFixed(2)}kg) domina sobre peso real (${P.toFixed(2)}kg).`)
    if (desmonta === 'sim') embLinhas.push("✓ Produto desmontável: peça reembalagem compacta à Hubbuycn.")
    else if (desmonta === 'parcial') embLinhas.push("✓ Desmontagem parcial: solicite redução máxima da caixa.")
    else embLinhas.push("Solicite embalagem mínima com plástico bolha, sem caixa original.")
  } else {
    embLinhas.push(`Peso real (${P.toFixed(2)}kg) domina. Foco em proteção, não em compactar.`)
  }
  secoes.push({ titulo: "📦 Embalagem", cor: "var(--blue)", linhas: embLinhas })

  // Declaração
  secoes.push({
    titulo: "🏷 Declaração Aduaneira",
    cor: "var(--accent)",
    linhas: [
      `Use: "${getDescricao(categoria, material)}"`,
      `Declare $${vd.toFixed(0)} USD — regime 20% (abaixo de $50).`,
      `Evite: nomes de marca, "vintage", "retro", "luxury", "crystal".`
    ]
  })

  // Alertas
  const alertas = []
  if (bateria !== 'nao') alertas.push("Produto com bateria — confirme aceitação na rota escolhida.")
  if (material === 'vidro') alertas.push("Vidro frágil — solicite bolha dupla e caixa rígida.")
  if (material === 'marmore') alertas.push("Mármore pesado — considere remover a base.")
  if (P > 4) alertas.push(`Produto pesado (${P.toFixed(2)}kg) — verifique limite de peso da rota.`)
  if (V > 45) alertas.push("Valor pago alto — declare conservador para ficar abaixo de $50.")
  if (nome.toLowerCase().includes('vintage') || nome.toLowerCase().includes('retro')) {
    alertas.push("Nome contém palavras premium — não use na declaração postal.")
  }
  if (alertas.length === 0) alertas.push("Nenhum alerta crítico para esse produto.")
  secoes.push({ titulo: "⚠ Alertas", cor: "var(--yellow)", linhas: alertas })

  return secoes
}
