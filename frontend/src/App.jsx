import { useState } from "react";

const TRIAGE_COLORS = {
  vermelho: { bg: "bg-red-600", border: "border-red-600", label: "Emergente", emoji: "🔴" },
  laranja: { bg: "bg-orange-500", border: "border-orange-500", label: "Muito Urgente", emoji: "🟠" },
  amarelo: { bg: "bg-yellow-400", border: "border-yellow-500", label: "Urgente", emoji: "🟡" },
  verde: { bg: "bg-green-500", border: "border-green-500", label: "Pouco Urgente", emoji: "🟢" },
  azul: { bg: "bg-blue-400", border: "border-blue-400", label: "Não Urgente", emoji: "🔵" },
};

export default function App() {
  const [step, setStep] = useState(1); // Controla em que etapa estamos
  
  // Dados do Formulário
  const [formData, setFormData] = useState({
    nome: "",
    idade: "",
    numUtente: "",
    telemovel: "",
    morada: "",
    genero: "",
    febre: false,
    faltaAr: false,
    dorPeito: false,
    desmaio: false,
    sintomas: ""
  });

  const [resposta, setResposta] = useState(null);
  const [loading, setLoading] = useState(false);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  async function handleAvaliar() {
    setLoading(true);
    // Criamos o prompt detalhado para o Llama 3
    const promptIA = `
      TRIAGEM MANCHESTER
      Paciente: ${formData.nome} (${formData.idade} anos, ${formData.genero})
      ID Utente: ${formData.numUtente} | Contacto: ${formData.telemovel}
      Morada: ${formData.morada}
      Sinais Críticos: Febre: ${formData.febre}, Falta Ar: ${formData.faltaAr}, Dor Peito: ${formData.dorPeito}, Desmaio: ${formData.desmaio}
      Descrição: ${formData.sintomas}
    `;

    try {
      const res = await fetch("http://localhost:8000/triagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintomas: promptIA }),
      });
      const data = await res.json();
      setResposta(data.resposta);
      setStep(4); // Vai para o passo final do resultado
    } catch (err) {
      alert("Erro ao ligar ao servidor!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-12 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Barra de Progresso Superior */}
        {step < 4 && (
          <div className="bg-slate-100 flex h-2">
            <div className={`transition-all duration-500 bg-blue-600 h-full w-${step}/3`} style={{width: `${(step/3)*100}%`}}></div>
          </div>
        )}

        <div className="p-8">
          {/* PASSO 1: IDENTIFICAÇÃO */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-slate-800">1. Identificação do Utente</h2>
              <p className="text-slate-500 text-sm">Dados administrativos necessários para o registo hospitalar.</p>
              <input type="text" placeholder="Nome Completo" className="w-full p-4 border rounded-2xl" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Nº de Utente (SNS)" className="p-4 border rounded-2xl" value={formData.numUtente} onChange={e => setFormData({...formData, numUtente: e.target.value})} />
                <input type="number" placeholder="Telemóvel" className="p-4 border rounded-2xl" value={formData.telemovel} onChange={e => setFormData({...formData, telemovel: e.target.value})} />
              </div>
              <input type="text" placeholder="Morada Completa" className="w-full p-4 border rounded-2xl" value={formData.morada} onChange={e => setFormData({...formData, morada: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Idade" className="p-4 border rounded-2xl" value={formData.idade} onChange={e => setFormData({...formData, idade: e.target.value})} />
                <select className="p-4 border rounded-2xl" value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})}>
                  <option value="">Género</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <button onClick={nextStep} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all">Próximo Passo</button>
            </div>
          )}

          {/* PASSO 2: SINAIS DE ALERTA */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-slate-800">2. Sinais de Alerta</h2>
              <p className="text-slate-500 text-sm">Selecione se apresenta algum destes sintomas críticos:</p>
              <div className="grid grid-cols-1 gap-3">
                {['febre', 'faltaAr', 'dorPeito', 'desmaio'].map(item => (
                  <label key={item} className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData[item] ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}>
                    <span className="capitalize font-medium text-slate-700">{item.replace('Ar', ' de Ar').replace('Peito', ' no Peito')}</span>
                    <input type="checkbox" className="w-6 h-6 rounded-full" checked={formData[item]} onChange={e => setFormData({...formData, [item]: e.target.checked})} />
                  </label>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold">Voltar</button>
                <button onClick={nextStep} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700">Próximo Passo</button>
              </div>
            </div>
          )}

          {/* PASSO 3: DESCRIÇÃO FINAL */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-slate-800">3. O que sente agora?</h2>
              <p className="text-slate-500 text-sm">Descreva detalhadamente a sua queixa principal.</p>
              <textarea 
                className="w-full h-48 p-4 border rounded-2xl resize-none focus:ring-2 focus:ring-blue-600 outline-none" 
                placeholder="Ex: Sinto uma dor de cabeça latejante que começou há 2 horas e tenho náuseas..."
                value={formData.sintomas}
                onChange={e => setFormData({...formData, sintomas: e.target.value})}
              />
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold outline-none">Voltar</button>
                <button onClick={handleAvaliar} disabled={loading} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all disabled:opacity-50">
                  {loading ? "A processar..." : "Finalizar Avaliação"}
                </button>
              </div>
            </div>
          )}

          {/* PASSO 4: RESULTADO */}
          {step === 4 && resposta && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
              <div className="text-center">
                <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">🩺</div>
                <h2 className="text-2xl font-bold text-slate-800">Resultado da Pré-Triagem</h2>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{resposta}</p>
              </div>
              <button onClick={() => window.location.reload()} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold">Nova Triagem</button>
            </div>
          )}
        </div>
      </div>
      <footer className="mt-8 text-slate-400 text-xs text-center leading-loose">
        TRIA-Home — Projeto Académico • ESTG <br/>
        Utiliza o Protocolo de Manchester e IA (Llama 3)
      </footer>
    </div>
  );
}