// supabase/functions/ai-titles/index.ts
// Edge Function — proxy seguro para a API do Claude
// Deploy: supabase functions deploy ai-titles
// Secret: supabase secrets set ANTHROPIC_API_KEY=sua-chave-aqui

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { base64, mimeType, categoria, fornecedor, nomeAtual, quantidade = 3 } =
      await req.json();

    const content: unknown[] = [];

    // Adiciona imagem se disponível
    if (base64 && mimeType) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: mimeType, data: base64 },
      });
    }

    const ctx = [
      categoria  ? `Categoria: ${categoria}`          : "",
      fornecedor ? `Fornecedor/Origem: ${fornecedor}` : "",
      nomeAtual  ? `Nome atual: ${nomeAtual}`           : "",
    ]
      .filter(Boolean)
      .join("\n");

    content.push({
      type: "text",
      text: `Você é especialista em vendas online no Brasil.
${base64 ? "Analise a imagem do produto acima e" : "Com base nas informações abaixo,"}
gere exatamente ${quantidade} sugestões de título para marketplace brasileiro (Mercado Livre, Shopee).

${ctx}

Regras:
- Título: máximo 70 caracteres, inclua marca/modelo se visível
- Descrição: máximo 120 caracteres, destaque o diferencial
- Use palavras-chave que compradores brasileiros buscam
- Não use emojis nos títulos
- Seja específico e objetivo

Retorne APENAS JSON válido, sem markdown:
[{"titulo":"...","descricao":"..."}]`,
    });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `API error ${res.status}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed.slice(0, quantidade)), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
