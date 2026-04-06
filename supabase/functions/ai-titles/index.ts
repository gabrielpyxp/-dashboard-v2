import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')

const NL = '\n'

function buildFullPrompt(qtde: number, usr: string): string {
  const P: string[] = []
  P.push(usr)
  P.push('')
  P.push(
    'Retorne um JSON array com exatamente ' +
    qtde + ' objetos. Cada objeto DEVE ' +
    'ter 4 campos: "titulo", "descricaoCurta", ' +
    '"descricaoLonga", "tags".'
  )
  P.push('')
  P.push('Regras do titulo:')
  P.push('- Maximo 60 caracteres')
  P.push('- Formato: Produto, Marca/Modelo, Diferencial')
  P.push('')
  P.push('Regras da descricaoCurta:')
  P.push('- Linha 1: nome do produto')
  P.push('- Linha 2: frase curta de impacto')
  P.push('- Linhas 3-5: ✅ com caracteristicas principais')
  P.push('- Linha 6: 📦 Produto novo')
  P.push('- Linha 7 em branco')
  P.push('- Linha 8: 🚚 Entregas em Cidade Ocidental e regiao.')
  P.push('- Linha 9: 💳 Parcelamento em ate 3x sem juros ou 12x com taxa.')
  P.push('')
  P.push('Regras da descricaoLonga:')
  P.push('- Linha 1: nome do produto')
  P.push('- Linhas 2-4: paragrafo persuasivo')
  P.push('- Linha 5 em branco')
  P.push('- Linha 6: "O que voce vai levar:"')
  P.push('- Linhas 7-10: 🔸 com detalhes tecnicos')
  P.push('- Linha 11: 📦 Estado do item')
  P.push('- Linha 12 em branco')
  P.push('- Linha 13: 🚚 Entregas em Cidade Ocidental e regiao.')
  P.push('- Linha 14: 💳 Parcelamento em ate 3x sem juros ou 12x com taxa.')
  P.push('')
  P.push('Regras das tags:')
  P.push('- 8 a 12 palavras-chave')
  P.push('- Separadas por virgula')
  P.push('- Tudo em minusculas e sem acentos')
  P.push('')
  P.push('Exemplo de OBJETO JSON valido (use EXATAMENTE esta estrutura):')
  const ex = {
    titulo: 'Mini Parafusadeira 3.6V USB',
    descricaoCurta:
      'Mini Parafusadeira Recarregavel' + NL +
      'Praticidade na palma da sua ma!' + NL +
      '\u2705 Bivolt USB recarregavel' + NL +
      '\u2705 3.6V de potencia' + NL +
      '\u2705 Leve e compacta' + NL +
      '\uD83D\uDCE6 Produto novo na caixa.' + NL +
      NL +
      '\uD83D\uDE9A Entregas em Cidade Ocidental e regiao.' + NL +
      '\uD83D\uDCB3 Parcelamento ate 3x sem ou 12x com taxa.',
    descricaoLonga:
      'Mini Parafusadeira 3.6V USB Recarregavel' + NL +
      'Facilite montagens do dia a dia. Ideal para moveis e reparos.' + NL +
      NL +
      'O que voce vai levar:' + NL +
      '\uD83D\uDD38 Motor 3.6V de alta rotacao' + NL +
      '\uD83D\uDD38 Bateria recarregavel via USB' + NL +
      '\uD83D\uDD38 Design compacto e leve' + NL +
      '\uD83D\uDD38 Acompanha kit de bits' + NL +
      '\uD83D\uDCE6 Estado: Novo na caixa.' + NL +
      NL +
      '\uD83D\uDE9A Entregas em Cidade Ocidental e regiao.' + NL +
      '\uD83D\uDCB3 Parcelamento ate 3x sem ou 12x com taxa.',
    tags: 'parafusadeira,parafusadeira usb,ferramenta eletrica,' +
      'parafusadeira 3.6v,bivolt,recarregavel,ferramenta compacta,' +
      'kit bits,monta moveis,mini ferramenta',
  }
  P.push(JSON.stringify([ex]))
  P.push('')
  P.push(
    'NAO crie texto fora do JSON. ' +
    'Cada objeto deve ter TODOS os 4 campos. ' +
    'Retorne APENAS o array JSON.'
  )
  return P.join(NL)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    })
  }

  try {
    const body = await req.json()
    const { base64, mimeType, instrucoes, quantidade } = body

    const qtde = quantidade || 3
    const sysPrompt = 'Retorne APENAS JSON array. Nada mais.'
    const usrPrompt = instrucoes ||
      'Analise esta imagem do produto e crie anuncios otimizados para marketplace.'
    const fullPrompt = buildFullPrompt(qtde, usrPrompt)

    let userContent: any[]
    if (base64 && mimeType) {
      const url = 'data:' + mimeType + ';base64,' + base64
      userContent = [
        { type: 'image_url', image_url: { url: url } },
        { type: 'text', text: fullPrompt },
      ]
    } else {
      userContent = [{ type: 'text', text: fullPrompt }]
    }

    const messages = [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: userContent },
    ]

    const authToken = 'Bearer ' + OPENROUTER_API_KEY

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'HTTP-Referer': 'https://gabrielpyxp.github.io/-dashboard-v2/',
        'X-Title': 'Revende Dashboard',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-plus:free',
        max_tokens: 4096,
        temperature: 0.3,
        messages: messages,
        seed: 0,
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error('OpenRouter API error: ' + resp.status + ' - ' + errText)
    }

    const data = await resp.json()
    let text: string = ''
    const c = data.choices
    if (c && c[0] && c[0].message) {
      text = c[0].message.content || ''
    }

    // Remove markdown code fences
    const f1 = '```json'
    const f2 = '```'
    if (text.indexOf(f1) === 0) {
      text = text.substring(f1.length)
    }
    const lf = text.lastIndexOf(f2)
    if (lf !== -1 && lf > 10) {
      text = text.substring(0, lf)
    }
    text = text.trim()

    // Tenta extrair o maior array JSON valido
    try {
      const results = JSON.parse(text)
      if (Array.isArray(results) && results.length > 0) {
        return new Response(JSON.stringify({ results }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
    } catch (_e) {
      // fallback
    }

    const match = text.match(/\[[\s\S]*\]/)
    if (!match) {
      throw new Error('Resposta invalida: ' + text.substring(0, 200))
    }

    const results = JSON.parse(match[0])
    if (!Array.isArray(results)) {
      throw new Error('Formato invalido: nao e array')
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    const err = error as Error
    return new Response(JSON.stringify({ error: err.message || String(error) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
