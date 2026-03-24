# ============================================================
# TRIA-Home | main.py — Backend FastAPI + Ollama (COMPLETO)
# ============================================================
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import requests
import json

# ----------------------------------------------------------
# 1. Configuração da Aplicação
# ----------------------------------------------------------
app = FastAPI(
    title="TRIA-Home API",
    description="API de pré-triagem baseada no Protocolo de Manchester",
    version="1.1.0"
)

# Configuração de CORS para permitir a ligação com o React (Porto 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------
# 2. Prompt do Sistema (O "Cérebro" da Triagem)
# ----------------------------------------------------------
SYSTEM_PROMPT = """És um assistente médico especializado no Protocolo de Manchester.
O teu objetivo é analisar os dados do paciente (identificação, sinais de alerta e descrição).

Responde OBRIGATORIAMENTE neste formato:
1. COR DE TRIAGEM: [Vermelho/Laranja/Amarelo/Verde/Azul]
2. NÍVEL: [Emergente/Muito Urgente/Urgente/Pouco Urgente/Não Urgente]
3. ANÁLISE CLÍNICA: (Explica os riscos detetados em 2-3 frases)
4. RECOMENDAÇÃO: (O que o utente deve fazer agora)
5. AVISO: Isto é uma pré-triagem informativa e não substitui o 112 ou avaliação médica presencial.

Sê rigoroso: dor no peito, falta de ar ou desmaios devem ser classificados como Laranja ou Vermelho."""

# ----------------------------------------------------------
# 3. Modelo de Dados (Validado para os 3 Passos do React)
# ----------------------------------------------------------
class PedidoTriagem(BaseModel):
    sintomas: str  # Este campo recebe o texto montado pelo React no Passo 3

    @validator("sintomas")
    def validar_sintomas(cls, v):
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Informação insuficiente para análise.")
        if len(v) > 3000: # Limite alargado para caber Morada, Contactos, etc.
            raise ValueError("Texto demasiado longo.")
        return v

# ----------------------------------------------------------
# 4. Comunicação com o Ollama
# ----------------------------------------------------------
def chamar_ollama(contexto_paciente: str) -> str:
    url = "http://localhost:11434/api/chat"
    
    payload = {
        "model": "llama3",
        "stream": False,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": contexto_paciente}
        ]
    }

    try:
        # Timeout de 90 segundos para dar tempo à IA de processar tudo
        response = requests.post(url, json=payload, timeout=90)
        response.raise_for_status()
        
        dados = response.json()
        return dados["message"]["content"]

    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Ollama não detetado. Ligue o Ollama no Windows.")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="A IA demorou muito a responder.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

# ----------------------------------------------------------
# 5. Endpoints (Rotas)
# ----------------------------------------------------------
@app.post("/triagem")
async def fazer_triagem(pedido: PedidoTriagem):
    # Envia os dados validados para o Ollama
    resposta_ia = chamar_ollama(pedido.sintomas)
    return {"resposta": resposta_ia}

@app.get("/health")
def health():
    return {"status": "online", "modelo": "llama3"}

@app.get("/")
def root():
    return {"mensagem": "Backend TRIA-Home a funcionar. Use o endpoint /triagem via POST."}