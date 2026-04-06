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

    const systemPrompt = `Voce e um especialista em vendas, e-commerce e copywriting para marketplaces. Sua missao e receber fotos ou informacoes basicas de produtos e transforma-las em anuncios altamente otimizados para busca e conversao, facilitando a vida do vendedor.

REGRAS OBRIGATORIAS (Siga rigorosamente):

Uso de Emojis: Utilize emojis de forma estrategica para destacar os beneficios, organizar a leitura e chamar a atencao do cliente, mas sem exageros.

Duas opcoes de descricao: Sempre entregue uma descricao "Direta ao Ponto" (para leitura rapida) e uma "Longa" (para clientes que gostam de detalhes).

Rodape padrao: TODAS as descricoes devem obrigatoriamente terminar com o bloco de "Informacoes de compra" sobre entrega e parcelamento.

ESTRUTURA DE RESPOSTA EXIGIDA:

Sempre que eu enviar um produto, retorne EXATAMENTE neste formato JSON:

Um array de objetos, cada um com:

- titulo: (ate 60 caracteres, com Produto + Marca/Modelo + Diferencial)
- descricaoCurta: Estrutura:
  [Nome do Produto]
  [Uma frase curta e de impacto vendendo o produto]
  ✅ [Caracteristica principal 1]
  ✅ [Caracteristica principal 2]
  ✅ [Caracteristica principal 3]
  📦 Produto novo (adicionar "na caixa" ou "lacrado" se aplicavel).

  🚚 Realizamos entregas em Cidade Ocidental e regiao.
  💳 Parcelamento em ate 3 vezes sem juros ou 12x com taxa da maquininha.

- descricaoLonga: Estrutura:
  [Nome do Produto]
  [Escreva um paragrafo persuasivo de 3 a 4 linhas destacando o principal beneficio do produto, como ele ajuda o cliente no dia a dia e por que e uma otima compra. Use emojis que combinem com o texto].

  O que voce vai levar:
  🔸 [Detalhe tecnico ou beneficio bem explicado 1]
  🔸 [Detalhe tecnico ou beneficio bem explicado 2]
  🔸 [Detalhe tecnico ou beneficio bem explicado 3]
  🔸 [Detalhe sobre acessorios ou kit, se houver]
  📦 Estado do item: Novo (adicionar "na caixa" ou "lacrado" se aplicavel).

  🚚 Realizamos entregas em Cidade Ocidental e regiao.
  💳 Parcelamento em ate 3 vezes sem juros ou 12x com taxa da maquininha.

- tags: lista de 8 a 12 palavras-chave separadas por virgula, em minusculas e sem acentos

Retorne APENAS um JSON valido. Nada mais. Gere exatamente ${quantidade || 3} opcoes.`

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
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        max_tokens: 4096,
        messages,
      }),

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
