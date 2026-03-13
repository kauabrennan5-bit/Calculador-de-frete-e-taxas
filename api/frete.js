// api/frete.js — Vercel Serverless Function
// Fluxo: recebe dados do form → faz login na Hubbuycn → chama calculateDeliveryFee → retorna rotas

const BASE_URL = 'https://api.hubbuycn.com'

// Cache simples em memória (dura enquanto a function está "quente")
let cachedToken = null
let tokenExpiry = 0

async function getToken() {
  const now = Date.now()

  // Reutiliza token se ainda válido (margem de 5 min)
  if (cachedToken && now < tokenExpiry) {
    return cachedToken
  }

  const email = process.env.HUBBUYCN_EMAIL
  const password = process.env.HUBBUYCN_PASSWORD

  if (!email || !password) {
    throw new Error('Credenciais não configuradas. Adicione HUBBUYCN_EMAIL e HUBBUYCN_PASSWORD nas variáveis de ambiente do Vercel.')
  }

  const resp = await fetch(`${BASE_URL}/api/user/loginByPwd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const data = await resp.json()

  if (!resp.ok || data.code !== 0) {
    throw new Error(`Falha no login Hubbuycn: ${data.message || resp.status}`)
  }

  // Salva token com validade de 2 horas
  cachedToken = data.token
  tokenExpiry = now + (2 * 60 * 60 * 1000)

  return cachedToken
}

export default async function handler(req, res) {
  // CORS para permitir chamadas do frontend
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { weight, length, width, height, productTypeId } = req.body

    // Validação básica
    if (!weight || !length || !width || !height) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios: weight, length, width, height' })
    }

    // Pega token (faz login se necessário)
    const token = await getToken()

    // Chama API de frete da Hubbuycn
    const freteResp = await fetch(`${BASE_URL}/api/Delivery/calculateDeliveryFee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        countryId: 30,          // Brasil fixo
        weight: parseFloat(weight),
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        productTypeId: parseInt(productTypeId) || 1
      })
    })

    const freteData = await freteResp.json()

    // Se token expirou, limpa cache e tenta de novo uma vez
    if (freteResp.status === 401) {
      cachedToken = null
      tokenExpiry = 0
      const newToken = await getToken()

      const retry = await fetch(`${BASE_URL}/api/Delivery/calculateDeliveryFee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`
        },
        body: JSON.stringify({
          countryId: 30,
          weight: parseFloat(weight),
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          productTypeId: parseInt(productTypeId) || 1
        })
      })

      const retryData = await retry.json()
      return res.status(200).json(retryData)
    }

    return res.status(200).json(freteData)

  } catch (err) {
    console.error('Erro na function frete:', err)
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
