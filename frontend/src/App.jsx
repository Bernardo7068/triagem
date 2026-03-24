// ============================================================
// TRIA-Home | App.jsx — Componente Principal
// Stack: React (Vite) + Tailwind CSS
// ------------------------------------------------------------
// Este ficheiro é o coração do frontend. Contém:
//   1. O ecrã de introdução de sintomas
//   2. A chamada ao backend FastAPI
//   3. A exibição do resultado da triagem
// ============================================================

import { useState } from "react";

// ---------------------------------------------------------
// Mapeamento das cores do Protocolo de Manchester
// Cada cor tem um significado clínico e visual próprio
// ---------------------------------------------------------
const TRIAGE_COLORS = {
  vermelho: {
    bg: "bg-red-600",
    border: "border-red-600",
    text: "text-red-700",
    light: "bg-red-50",
    label: "Emergente",
    emoji: "🔴",
    desc: "Situação com risco de vida imediato. Dirija-se à urgência imediatamente.",
  },
  laranja: {
    bg: "bg-orange-500",
    border: "border-orange-500",
    text: "text-orange-700",
    light: "bg-orange-50",
    label: "Muito Urgente",
    emoji: "🟠",
    desc: "Situação grave. Deve ser atendido nos próximos 10 minutos.",
  },
  amarelo: {
    bg: "bg-yellow-400",
    border: "border-yellow-500",
    text: "text-yellow-700",
    light: "bg-yellow-50",
    label: "Urgente",
    emoji: "🟡",
    desc: "Situação urgente mas estável. Tempo de espera até 60 minutos.",
  },
  verde: {
    bg: "bg-green-500",
    border: "border-green-500",
    text: "text-green-700",
    light: "bg-green-50",
    label: "Pouco Urgente",
    emoji: "🟢",
    desc: "Situação não urgente. Pode considerar consulta de médico de família.",
  },
  azul: {
    bg: "bg-blue-400",
    border: "border-blue-400",
    text: "text-blue-700",
    light: "bg-blue-50",
    label: "Não Urgente",
    emoji: "🔵",
    desc: "Situação não urgente. Pode aguardar consulta programada.",
  },
};

// ---------------------------------------------------------
// Função auxiliar: deteta a cor de triagem na resposta da IA
// Percorre o texto à procura de palavras-chave em português
// ---------------------------------------------------------
function detectarCorTriagem(texto) {
  const t = texto.toLowerCase();
  if (t.includes("vermelho") || t.includes("emergente") || t.includes("imediato"))
    return "vermelho";
  if (t.includes("laranja") || t.includes("muito urgente"))
    return "laranja";
  if (t.includes("amarelo") || t.includes("urgente"))
    return "amarelo";
  if (t.includes("verde") || t.includes("pouco urgente"))
    return "verde";
  if (t.includes("azul") || t.includes("não urgente") || t.includes("nao urgente"))
    return "azul";
  return null; // não foi possível determinar a cor
}

// ==========================================================
// COMPONENTE PRINCIPAL — App
// ==========================================================
export default function App() {
  // -------------------------------------------------------
  // useState: variáveis de estado do componente
  // -------------------------------------------------------

  // Texto que o utente escreve na caixa de sintomas
  const [sintomas, setSintomas] = useState("");

  // Resposta completa recebida do backend (texto da IA)
  const [resposta, setResposta] = useState(null);

  // true quando estamos à espera da resposta do backend
  const [loading, setLoading] = useState(false);

  // Mensagem de erro caso algo corra mal
  const [erro, setErro] = useState(null);

  // Cor de triagem detetada na resposta (ex: "vermelho", "verde")
  const [corTriagem, setCorTriagem] = useState(null);

  // -------------------------------------------------------
  // Confirmação LGPD/RGPD antes de enviar
  // -------------------------------------------------------
  const [consentimento, setConsentimento] = useState(false);

  // -------------------------------------------------------
  // handleAvaliar: função disparada ao clicar "Avaliar"
  // -------------------------------------------------------
  async function handleAvaliar() {
    // Validações básicas antes de chamar o backend
    if (!sintomas.trim()) {
      setErro("Por favor descreva os seus sintomas antes de continuar.");
      return;
    }
    if (!consentimento) {
      setErro("Deve aceitar os termos de privacidade para continuar.");
      return;
    }
    if (sintomas.trim().length < 20) {
      setErro("Por favor descreva os sintomas com mais detalhe (mínimo 20 caracteres).");
      return;
    }

    // Limpar estados anteriores e ativar o loading
    setErro(null);
    setResposta(null);
    setCorTriagem(null);
    setLoading(true);

    try {
      // ---------------------------------------------------
      // PASSO 3 — Chamada fetch ao endpoint FastAPI
      // POST http://localhost:8000/triagem
      // Envia JSON com os sintomas, recebe a análise da IA
      // ---------------------------------------------------
      const response = await fetch("http://localhost:8000/triagem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sintomas: sintomas.trim() }),
      });

      // Se o servidor devolver erro HTTP (ex: 500), tratar aqui
      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      // Converter a resposta para JSON
      const dados = await response.json();

      // O backend devolve { resposta: "texto da IA..." }
      setResposta(dados.resposta);

      // Tentar detetar a cor de triagem no texto recebido
      const cor = detectarCorTriagem(dados.resposta);
      setCorTriagem(cor);

    } catch (err) {
      // Tratar erros de rede (backend desligado, etc.)
      if (err.message.includes("fetch")) {
        setErro("Não foi possível ligar ao servidor. Certifique-se que o backend está em execução em localhost:8000.");
      } else {
        setErro(`Ocorreu um erro: ${err.message}`);
      }
    } finally {
      // Desativar o loading independentemente do resultado
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // handleLimpar: reinicia o formulário para novo utente
  // -------------------------------------------------------
  function handleLimpar() {
    setSintomas("");
    setResposta(null);
    setErro(null);
    setCorTriagem(null);
    setConsentimento(false);
  }

  // -------------------------------------------------------
  // Obter as propriedades visuais da cor de triagem detetada
  // -------------------------------------------------------
  const infoTriagem = corTriagem ? TRIAGE_COLORS[corTriagem] : null;

  // -------------------------------------------------------
  // RENDER — O que é apresentado no ecrã
  // -------------------------------------------------------
  return (
    // Fundo geral da página — cinzento muito suave
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ================================================
          HEADER — Cabeçalho com logo e nome do sistema
      ================================================= */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {/* Ícone simples em SVG — cruz médica */}
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-6-6h12" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">TRIA-Home</h1>
            <p className="text-xs text-slate-500">Sistema Inteligente de Triagem • Protocolo de Manchester</p>
          </div>
          {/* Badge de segurança */}
          <div className="ml-auto hidden sm:flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
            Ligação Segura
          </div>
        </div>
      </header>

      {/* ================================================
          CONTEÚDO PRINCIPAL
      ================================================= */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* -----------------------------------------------
            AVISO MÉDICO — Sempre visível no topo
        ------------------------------------------------ */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <p className="text-sm text-amber-800">
            <strong>Aviso importante:</strong> Esta ferramenta é apenas de pré-triagem informativa.
            Em caso de <strong>emergência médica</strong>, ligue imediatamente para o <strong>112</strong>.
          </p>
        </div>

        {/* -----------------------------------------------
            CARD PRINCIPAL — Formulário de sintomas
        ------------------------------------------------ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Cabeçalho do card */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Descreva os seus sintomas</h2>
            <p className="text-sm text-slate-500 mt-1">
              Seja o mais detalhado possível: há quanto tempo tem os sintomas, onde dói, que intensidade, etc.
            </p>
          </div>

          {/* Corpo do formulário */}
          <div className="px-6 py-5 space-y-4">

            {/* Caixa de texto principal */}
            <textarea
              className="w-full h-36 px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ex: Tenho dor no peito há 2 horas, sinto falta de ar ao subir escadas e suores frios. A dor irradia para o braço esquerdo..."
              value={sintomas}
              onChange={(e) => setSintomas(e.target.value)} // atualiza o estado a cada tecla
              disabled={loading} // desativa enquanto aguarda resposta
              maxLength={1000} // limite de segurança
            />

            {/* Contador de caracteres */}
            <p className="text-xs text-slate-400 text-right">{sintomas.length}/1000 caracteres</p>

            {/* Checkbox de consentimento RGPD */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={consentimento}
                onChange={(e) => setConsentimento(e.target.checked)}
                disabled={loading}
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                Concordo que os dados introduzidos sejam processados para fins de pré-triagem, de acordo com o
                <span className="text-blue-600 font-medium"> Regulamento Geral de Proteção de Dados (RGPD)</span>.
                Os dados não são armazenados de forma identificável sem autenticação.
              </span>
            </label>

            {/* Mensagem de erro (só aparece quando há erro) */}
            {erro && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm text-red-700">{erro}</p>
              </div>
            )}

            {/* Botão principal de avaliação */}
            <button
              onClick={handleAvaliar}
              disabled={loading} // desativa durante o loading
              className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200
                ${loading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"        // estado a carregar
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg"  // estado normal
                }`}
            >
              {loading ? (
                /* Indicador de loading com ícone animado */
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  A IA está a analisar os seus sintomas...
                </span>
              ) : (
                "🔍 Avaliar Sintomas"
              )}
            </button>
          </div>
        </div>

        {/* -----------------------------------------------
            RESULTADO DA TRIAGEM
            Só aparece quando há uma resposta da IA
        ------------------------------------------------ */}
        {resposta && (
          <div className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden
            ${infoTriagem ? infoTriagem.border : "border-slate-200"}`}>

            {/* Cabeçalho do resultado com a cor de triagem */}
            {infoTriagem && (
              <div className={`${infoTriagem.bg} px-6 py-4 flex items-center gap-3`}>
                <span className="text-2xl">{infoTriagem.emoji}</span>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{infoTriagem.label}</p>
                  <p className="text-white/80 text-sm">{infoTriagem.desc}</p>
                </div>
              </div>
            )}

            {/* Texto completo da resposta da IA */}
            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Análise da IA (Protocolo de Manchester)
              </h3>
              {/* Renderiza cada linha da resposta como parágrafo */}
              <div className="space-y-2">
                {resposta.split("\n").filter(l => l.trim()).map((linha, i) => (
                  <p key={i} className="text-sm text-slate-700 leading-relaxed">{linha}</p>
                ))}
              </div>
            </div>

            {/* Rodapé do resultado */}
            <div className="px-6 pb-5 flex flex-col sm:flex-row gap-3">
              {/* Botão para nova avaliação */}
              <button
                onClick={handleLimpar}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Nova Avaliação
              </button>
              {/* Botão de check-in (simulado — ligará ao quiosque hospitalar) */}
              <button
                className="flex-1 py-2.5 px-4 bg-slate-800 rounded-xl text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                onClick={() => alert("Funcionalidade de check-in hospitalar em desenvolvimento.\nNa versão final, redireciona para o quiosque com o Cartão de Cidadão.")}
              >
                🏥 Proceder ao Check-in
              </button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------
            LEGENDA DAS CORES DE MANCHESTER
            Sempre visível em baixo para contexto
        ------------------------------------------------ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Protocolo de Manchester — Níveis de Urgência
          </h3>
          <div className="space-y-2">
            {Object.entries(TRIAGE_COLORS).map(([cor, info]) => (
              <div key={cor} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${info.light}`}>
                <span className="text-lg">{info.emoji}</span>
                <div>
                  <span className={`text-sm font-semibold ${info.text}`}>{info.label}</span>
                  <span className="text-xs text-slate-500 ml-2">{info.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ================================================
          FOOTER
      ================================================= */}
      <footer className="text-center py-6 text-xs text-slate-400">
        TRIA-Home © 2025 · Martim Ribeiro · Bernardo Inácio · Fábio Nunes · ESTG / IPL
      </footer>
    </div>
  );
}
