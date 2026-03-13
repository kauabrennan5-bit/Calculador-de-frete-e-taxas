import { useState } from 'react'
import { calcTributos, valorIdealDeclarar, getDescricao, gerarAnalise, getProductTypeId } from './calculos.js'

// ── COMPONENTES BASE ──────────────────────────────────────────────────────

function Label({ children }) {
  return <div style={{ color:'var(--accent)', fontSize:10, letterSpacing:2, textTransform:'uppercase', fontFamily:"'Space Mono', monospace", marginBottom:6 }}>{children}</div>
}

function Field({ label, children }) {
  return <div><Label>{label}</Label>{children}</div>
}

function Sec({ n, title, children }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <span style={{ fontFamily:"'Space Mono', monospace", fontSize:10, color:'var(--muted)', letterSpacing:3, textTransform:'uppercase', whiteSpace:'nowrap' }}>{n} — {title}</span>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
      </div>
      {children}
    </div>
  )
}

function Block({ title, children }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderLeft:'3px solid var(--accent)', borderRadius:6, padding:'18px 20px', marginBottom:12 }}>
      <div style={{ fontFamily:"'Space Mono', monospace", fontSize:10, color:'var(--accent)', letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>◆ {title}</div>
      {children}
    </div>
  )
}

function Card({ label, value, sub, color }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:'16px 14px' }}>
      <div style={{ fontFamily:"'Space Mono', monospace", fontSize:9, color:'var(--muted)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:900, color:color||'var(--accent)', lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"'Space Mono', monospace", fontSize:10, color:'var(--muted)', marginTop:6 }}>{sub}</div>
    </div>
  )
}

const INP = {
  width:'100%', background:'var(--surface2)', border:'1px solid var(--border)',
  color:'var(--text)', borderRadius:4, padding:'11px 14px', fontSize:14,
  outline:'none', boxSizing:'border-box', transition:'border-color 0.2s'
}

// ── APP ──────────────────────────────────────────────────────────────────

export default function App() {
  const [f, setF] = useState({
    nome:'', material:'', categoria:'',
    comp:'', larg:'', alt:'', peso:'',
    valor:'', cambio:'5.83',
    desmonta:'nao', bateria:'nao', contexto:''
  })
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [focused, setFocused] = useState(null)

  const s = (k,v) => setF(p => ({...p,[k]:v}))

  const inp = (k) => ({
    ...INP,
    borderColor: focused === k ? 'var(--accent)' : 'var(--border)',
    onFocus: () => setFocused(k),
    onBlur: () => setFocused(null),
  })

  async function calcular() {
    if (!f.nome||!f.comp||!f.larg||!f.alt||!f.peso||!f.valor) {
      setErr('Preencha pelo menos: nome, dimensões, peso e valor.')
      return
    }
    setErr('')
    setLoading(true)
    setRes(null)

    const C=+f.comp, L=+f.larg, A=+f.alt
    const P=+f.peso/1000, V=+f.valor, CB=+f.cambio||5.83
    const vol8=(C*L*A)/8000

    try {
      // Chama Vercel Function que acessa a Hubbuycn
      const resp = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: P,
          length: C,
          width: L,
          height: A,
          productTypeId: getProductTypeId(f.bateria)
        })
      })

      const data = await resp.json()

      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`)

      // Normaliza rotas retornadas pela API
      const rotas = (data.routes || []).map(r => ({
        nome: r.routeName,
        freteUSD: r.price,
        freteBRL: r.price * CB,
        dias: `${r.minDays}-${r.maxDays}`,
        volumetricFactor: r.volumetricFactor,
        maxWeight: r.maxWeight,
        pesoFat: Math.max(P, (C*L*A) / (r.volumetricFactor || 8000))
      }))

      if (rotas.length === 0) throw new Error('Nenhuma rota disponível para esse produto.')

      const melhor = [...rotas].sort((a,b) => a.freteBRL - b.freteBRL)[0]
      const vd = valorIdealDeclarar(V)
      const trib = calcTributos(vd, CB)
      const landed = (V*CB) + melhor.freteBRL + trib.total
      const rel = landed / (V*CB)
      const desc = getDescricao(f.categoria, f.material)
      const analise = gerarAnalise({
        nome:f.nome, categoria:f.categoria, material:f.material,
        desmonta:f.desmonta, bateria:f.bateria,
        rel, melhor, P, vol8, vd, V, landed, trib, CB
      })

      setRes({ rotas, melhor, landed, trib, vd, rel, analise, CB, V, P, vol8, desc, real: true })

      setTimeout(() => {
        document.getElementById('resultado')?.scrollIntoView({ behavior:'smooth', block:'start' })
      }, 100)

    } catch(e) {
      setErr(`Erro ao buscar fretes: ${e.message}`)
    }

    setLoading(false)
  }

  const verd = res && (
    res.rel < 2   ? { c:'var(--green)',  bg:'rgba(74,222,128,0.1)',  t:'✓ VALE A PENA' } :
    res.rel < 3   ? { c:'var(--yellow)', bg:'rgba(250,204,21,0.1)',  t:'⚠ ATENÇÃO' } :
                    { c:'var(--red)',    bg:'rgba(248,113,113,0.1)', t:'✕ FRETE ALTO' }
  )

  const MATS = [['metal','Metal/Aço/Cromo'],['bronze','Bronze/Cobre'],['vidro','Vidro'],['plastico','Plástico/Acrílico'],['ceramica','Cerâmica'],['madeira','Madeira'],['marmore','Mármore/Pedra'],['misto','Misto']]
  const CATS = [['luminaria','Luminária/Lamp'],['decoracao','Decoração'],['quadro','Quadro/Arte'],['eletronico','Eletrônico/Relógio'],['prato','Prato/Utensílio'],['movel','Móvel'],['outro','Outro']]

  return (
    <div style={{ maxWidth:820, margin:'0 auto', padding:'32px 16px 100px' }}>

      {/* HEADER */}
      <header style={{ borderBottom:'1px solid var(--border)', paddingBottom:24, marginBottom:40 }}>
        <div style={{ fontFamily:"'Space Mono', monospace", fontSize:10, color:'var(--accent)', letterSpacing:4, marginBottom:8 }}>IMPORTCALC — B2C</div>
        <h1 style={{ fontSize:'clamp(28px, 6vw, 48px)', fontWeight:800, letterSpacing:-1, lineHeight:1, margin:0 }}>
          China <span style={{ color:'var(--accent)' }}>→</span> Brasil
        </h1>
        <p style={{ fontFamily:"'Space Mono', monospace", fontSize:11, color:'var(--muted)', marginTop:10, lineHeight:1.6 }}>
          Fretes reais da Hubbuycn · Tributos calculados · Viabilidade instantânea
        </p>
      </header>

      {/* FORM */}
      <Sec n="01" title="produto">
        <div style={{ display:'grid', gap:14 }}>
          <Field label="Nome do produto">
            <input style={inp('nome')} value={f.nome} onChange={e=>s('nome',e.target.value)} placeholder="Ex: Mushroom Table Lamp, dragão de bronze, relógio flip"/>
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="Material principal">
              <select style={inp('mat')} value={f.material} onChange={e=>s('material',e.target.value)}>
                <option value="">Selecione...</option>
                {MATS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Categoria">
              <select style={inp('cat')} value={f.categoria} onChange={e=>s('categoria',e.target.value)}>
                <option value="">Selecione...</option>
                {CATS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Sec>

      <Sec n="02" title="dimensões e peso">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
          <Field label="Comprimento (cm)"><input style={inp('comp')} type="number" value={f.comp} onChange={e=>s('comp',e.target.value)} placeholder="44"/></Field>
          <Field label="Largura (cm)"><input style={inp('larg')} type="number" value={f.larg} onChange={e=>s('larg',e.target.value)} placeholder="28"/></Field>
          <Field label="Altura (cm)"><input style={inp('alt')} type="number" value={f.alt} onChange={e=>s('alt',e.target.value)} placeholder="22"/></Field>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Field label="Peso real (gramas)"><input style={inp('peso')} type="number" value={f.peso} onChange={e=>s('peso',e.target.value)} placeholder="1467"/></Field>
          <Field label="Pode desmontar?">
            <select style={inp('desm')} value={f.desmonta} onChange={e=>s('desmonta',e.target.value)}>
              <option value="nao">Não</option><option value="sim">Sim</option><option value="parcial">Parcialmente</option>
            </select>
          </Field>
        </div>
      </Sec>

      <Sec n="03" title="valor e logística">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          <Field label="Valor pago (USD $)"><input style={inp('val')} type="number" step="0.01" value={f.valor} onChange={e=>s('valor',e.target.value)} placeholder="19.30"/></Field>
          <Field label="Câmbio USD/BRL"><input style={inp('cam')} type="number" step="0.01" value={f.cambio} onChange={e=>s('cambio',e.target.value)}/></Field>
          <Field label="Tem bateria?">
            <select style={inp('bat')} value={f.bateria} onChange={e=>s('bateria',e.target.value)}>
              <option value="nao">Não</option><option value="interna">Bateria interna</option><option value="externa">Bateria removível</option>
            </select>
          </Field>
        </div>
      </Sec>

      <Sec n="04" title="contexto (opcional)">
        <Field label="Detalhes adicionais">
          <textarea style={{ ...INP, minHeight:80, resize:'vertical' }} value={f.contexto} onChange={e=>s('contexto',e.target.value)} placeholder="Ex: controle remoto, cabo USB, embalagem original..."/>
        </Field>
      </Sec>

      <button onClick={calcular} disabled={loading} style={{
        width:'100%', padding:'16px', background:loading?'#7a6010':'var(--accent)',
        color:'#000', border:'none', borderRadius:4, fontSize:15, fontWeight:800,
        letterSpacing:2, textTransform:'uppercase', cursor:loading?'not-allowed':'pointer', transition:'all 0.15s'
      }}>
        {loading ? <><span className="spin">⟳</span> &nbsp;BUSCANDO FRETES REAIS...</> : 'CALCULAR IMPORTAÇÃO'}
      </button>

      {err && (
        <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid var(--red)', color:'var(--red)', padding:14, borderRadius:4, marginTop:12, fontSize:13 }}>
          {err}
        </div>
      )}

      {/* RESULTADO */}
      {res && (
        <div id="resultado" className="fade-up" style={{ marginTop:52 }}>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <span style={{ fontFamily:"'Space Mono', monospace", fontSize:10, color:'var(--muted)', letterSpacing:3 }}>RESULTADO DA ANÁLISE</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            {res.real && (
              <span style={{ fontFamily:"'Space Mono', monospace", fontSize:9, color:'var(--green)', letterSpacing:2, background:'rgba(74,222,128,0.1)', border:'1px solid var(--green)', padding:'3px 10px', borderRadius:3 }}>
                ● FRETES REAIS HUBBUYCN
              </span>
            )}
          </div>

          {/* Veredicto */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
            <div style={{ padding:'8px 20px', borderRadius:4, background:verd.bg, border:`1px solid ${verd.c}`, color:verd.c, fontWeight:800, fontSize:14, letterSpacing:1 }}>
              {verd.t}
            </div>
            <div style={{ fontFamily:"'Space Mono', monospace", fontSize:11, color:'var(--muted)' }}>
              custo total = {res.rel.toFixed(1)}× o valor pago
            </div>
          </div>

          {/* Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:14 }}>
            <Card label="Peso faturável" value={`${res.melhor.pesoFat.toFixed(2)} kg`} sub={res.P >= res.vol8 ? 'peso real domina' : 'volumétrico domina'}/>
            <Card label="Frete real" value={`R$${res.melhor.freteBRL.toFixed(0)}`} sub={res.melhor.nome}/>
            <Card label="Landed cost" value={`R$${res.landed.toFixed(0)}`} sub="produto + frete + tributos" color="var(--red)"/>
          </div>

          {/* Declaração */}
          <Block title="declaração aduaneira recomendada">
            <div style={{ background:'#0d0d0d', border:'1px solid var(--accent)', borderRadius:5, overflow:'hidden' }}>
              {[
                ['Descrição', res.desc, true],
                ['Valor declarado', `$${res.vd.toFixed(0)} USD`, true],
                ['Regime tributário', '20% — abaixo de $50 ✓', false],
                ['Imposto federal est.', `R$${res.trib.fed.toFixed(0)}`, false],
                ['ICMS est.', `R$${res.trib.icms.toFixed(0)}`, false],
                ['Total tributos', `R$${res.trib.total.toFixed(0)}`, true],
              ].map(([k,v,hl],i) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:i<5?'1px solid #1a1a1a':'none' }}>
                  <span style={{ fontFamily:"'Space Mono', monospace", fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1 }}>{k}</span>
                  <span style={{ fontWeight:700, color:hl?'var(--accent)':'#c8c4b8', fontSize:13, textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
            </div>
          </Block>

          {/* Rotas reais */}
          <Block title={`rotas disponíveis — ${res.rotas.length} encontradas`}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:400 }}>
                <thead>
                  <tr>{['Rota','Peso fat.','Frete real','Prazo',''].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontFamily:"'Space Mono', monospace", fontSize:9, color:'var(--muted)', letterSpacing:2, textTransform:'uppercase', borderBottom:'1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {res.rotas.map(r => {
                    const b = r.nome === res.melhor.nome
                    return (
                      <tr key={r.nome} style={{ background:b?'rgba(240,192,64,0.04)':'transparent' }}>
                        <td style={{ padding:'9px 10px', color:b?'var(--accent)':'var(--muted)', fontWeight:b?700:400 }}>{r.nome}</td>
                        <td style={{ padding:'9px 10px', color:b?'var(--text)':'var(--muted)' }}>{r.pesoFat.toFixed(2)} kg</td>
                        <td style={{ padding:'9px 10px', color:b?'var(--text)':'var(--muted)', fontWeight:b?700:400 }}>R${r.freteBRL.toFixed(0)}</td>
                        <td style={{ padding:'9px 10px', color:b?'var(--text)':'var(--muted)' }}>{r.dias}d</td>
                        <td style={{ padding:'9px 10px' }}>{b&&<span style={{ background:'rgba(240,192,64,0.15)', color:'var(--accent)', padding:'2px 10px', borderRadius:3, fontSize:10, fontFamily:"'Space Mono', monospace", fontWeight:700 }}>MELHOR</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Block>

          {/* Análise */}
          <Block title="análise personalizada">
            <div style={{ display:'grid', gap:16 }}>
              {res.analise.map((sec,i) => (
                <div key={i} style={{ borderBottom:i<res.analise.length-1?'1px solid var(--border)':'none', paddingBottom:i<res.analise.length-1?16:0 }}>
                  <div style={{ fontWeight:700, color:sec.cor, fontSize:13, marginBottom:8 }}>{sec.titulo}</div>
                  {sec.linhas.map((l,j) => <div key={j} style={{ fontSize:13, color:'#888', lineHeight:1.7, paddingLeft:4 }}>{l}</div>)}
                </div>
              ))}
            </div>
          </Block>

          {/* Resumo */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:'16px 20px' }}>
            <div style={{ fontFamily:"'Space Mono', monospace", fontSize:9, color:'var(--muted)', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>◆ resumo financeiro</div>
            {[
              ['Produto (valor pago)', `R$${(res.V*res.CB).toFixed(0)}`],
              [`Frete (${res.melhor.nome})`, `R$${res.melhor.freteBRL.toFixed(0)}`],
              ['Tributos estimados', `R$${res.trib.total.toFixed(0)}`],
              ['TOTAL LANDED COST', `R$${res.landed.toFixed(0)}`],
            ].map(([k,v],i) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:i<3?'1px solid var(--border)':'none' }}>
                <span style={{ color:i===3?'var(--accent)':'var(--muted)', fontWeight:i===3?700:400, fontSize:13 }}>{k}</span>
                <span style={{ color:i===3?'var(--red)':'var(--text)', fontWeight:i===3?900:600, fontSize:13 }}>{v}</span>
              </div>
            ))}
          </div>

          <button onClick={() => { setRes(null); window.scrollTo({top:0,behavior:'smooth'}) }}
            style={{ marginTop:24, width:'100%', padding:'12px', background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:4, fontSize:13, cursor:'pointer', letterSpacing:1 }}>
            ↑ NOVO CÁLCULO
          </button>
        </div>
      )}
    </div>
  )
}
