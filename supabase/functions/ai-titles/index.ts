import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')

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

    const systemPrompt = `Voce e um especialista em vendas, e-commerce e copywriting para marketplaces. Sua missao e receber fotos ou informacoes basicas de produtos e transforma-las em anuncios altamente otimizados para busca e conversao.

REGRAS OBRIGATORIAS:
1. Use emojis de forma estrategica para destacar beneficios, organizar leitura e chamar atencao sem exageros.
2. Sempre entregue DUAS descricoes: uma "Direta ao Ponto" e uma "Completa".
3. TODAS as descricoes devem terminar com o bloco padrao de entrega e parcelamento.

Retorne APENAS um JSON valido no seguinte formato, com ${quantidade || 3} objetos no array:

[
  {
    "titulo": "Titulo chamativo com no maximo 60 caracteres",
    "descricaoCurta": "Nome do produto\\nFrases curtas com ✅ de caracteristicas\\n🚚 Entrega\\n💳 Parcelamento",
    "descricaoLonga": "Nome do produto\\nParagrafo persuasivo de 3-4 linhas com emojis\\nO que voce vai levar com 🔸\\n🚚 Entrega\\n💳 Parcelamento",
    "tags": "tags separadas por virgula em minusculas e sem acentos"
  }
]

IMPORTANTE: Use quebras de linha reais (\\n) nas descricoes. Retorne SOMENTE o array JSON, nada mais.`

    const userText = instrucoes || 'Analise esta imagem do produto e crie anuncios otimizados para marketplace.'

    const userContent: Array<any> = base64 && mimeType
      ? [{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }, { type: 'text', text: userText }]
      : [{ type: 'text', text: userText }]

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ]

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://gabrielpyxp.github.io/-dashboard-v2/',
        'X-Title': 'Revende Dashboard',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-plus:free',
        max_tokens: 4096,
        messages,
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`OpenRouter API error: ${resp.status} - ${errText}`)
    }

    const data = await resp.json()
    const text = data.choices?.[0]?.message?.content || ''

    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Resposta invalida da IA')

    const results = JSON.parse(match[0])
    if (!Array.isArray(results)) throw new Error('Formato de resposta invalido')

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
