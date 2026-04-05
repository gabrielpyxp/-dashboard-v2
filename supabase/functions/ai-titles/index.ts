import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

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
    const { base64, mimeType, categoria, fornecedor, nomeAtual, quantidade, descricao } = body

    const imageContent = base64 ? [{
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: mimeType,
        data: base64,
      },
    }] : []

    const productInfo = `Produto: ${nomeAtual || 'Desconhecido'}\nCategoria: ${categoria || 'Nao informada'}\nFornecedor: ${fornecedor || 'Nao informado'}\nCusto: R$ ${body.custo || 'N/A'}\nDescricao atual: ${descricao || 'Nenhuma'}\nQuantidade de sugestoes: ${quantidade || 3}`

    const prompt = `Voce e especialista em copywriting para e-commerce. Com base nas informacoes do produto${base64 ? ' e na imagem fornecida' : ''}, gere ${quantidade || 3} opcoes de titulo e descricao otimizados para marketplace (Mercado Livre, Shopee).\n\nRegras:\n- Titulos: maximo 60 caracteres, com palavras-chave do produto\n- Descricoes: persuasivas, max 200 caracteres, destaque diferenciais\n- Gere exatamente ${quantidade || 3} opcoes\n\nResponda APENAS com JSON valido neste formato:\n[{"titulo": "opcao 1", "descricao": "descricao 1"}, {"titulo": "opcao 2", "descricao": "descricao 2"}]\n\nProduto: ${productInfo}`

    const messages: any[] = [{
      role: 'user',
      content: [...imageContent, { type: 'text', text: prompt }],
    }]

    const resp = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages,
      }),
    })

    if (!resp.ok) {
      throw new Error(`Anthropic API error: ${resp.status}`)
    }

    const data = await resp.json()
    const text = data.content[0].text
    const json = JSON.parse(text)

    return new Response(JSON.stringify(json), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
