# ============================================================
# TRIA-Home | main.py — Backend FastAPI + Ollama
# ============================================================
# Como correr:
#   1. Instalar dependências: pip install fastapi uvicorn requests
#   2. Garantir que o Ollama está a correr: ollama serve
#   3. Garantir que o modelo existe: ollama pull llama3
#   4. Iniciar o servidor: uvicorn main:app --reload
#
# O servidor fica disponível em: http://localhost:8000
# Documentação automática em:   http://localhost:8000/docs
# ============================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import requests
import json

# ----------------------------------------------------------
# 1. Criar a aplicação FastAPI
# ----------------------------------------------------------
app = FastAPI(
    title="TRIA-Home API",
    description="API de pré-triagem médica baseada no Protocolo de Manchester",
    version="1.0.0"
)

# ----------------------------------------------------------
# 2. Configuração de CORS
# Permite que o React (noutro porto) comunique com esta API
# Sem isto, o browser bloquearia os pedidos por segurança
# ----------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Porto padrão do Vite
    allow_credentials=True,
    allow_methods=["POST", "GET"],            # Métodos HTTP permitidos
    allow_headers=["*"],                      # Cabeçalhos permitidos
)

# ----------------------------------------------------------
# 3. Modelo de dados de entrada (validação automática)
# O Pydantic garante que o JSON recebido tem o formato certo
# ----------------------------------------------------------
class PedidoTriagem(BaseModel):
    sintomas: str  # Texto com os sintomas descritos pelo utente

    # Validação: sintomas não podem estar vazios nem ser muito curtos
    @validator("sintomas")
    def validar_sintomas(cls, v):
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Descrição de sintomas demasiado curta.")
        if len(v) > 1000:
            raise ValueError("Descrição de sintomas demasiado longa (máx. 1000 caracteres).")
        return v

# ----------------------------------------------------------
# 4. Prompt do sistema para guiar o modelo de IA
# Define o comportamento e formato de resposta esperado
# ----------------------------------------------------------
SYSTEM_PROMPT = """És um assistente médico de pré-triagem que usa o Protocolo de Manchester.
O teu papel é analisar os sintomas descritos e classificar a urgência.

Responde SEMPRE neste formato:
1. COR DE TRIAGEM: [Vermelho/Laranja/Amarelo/Verde/Azul]
2. NÍVEL: [Emergente/Muito Urgente/Urgente/Pouco Urgente/Não Urgente]
3. ANÁLISE: (2-3 frases explicando o raciocínio clínico)
4. RECOMENDAÇÃO: (instrução clara para o utente)
5. AVISO: Lembra sempre que isto é uma pré-triagem e não substitui avaliação médica.

Sê claro, direto e usa linguagem acessível ao cidadão comum."""

# ----------------------------------------------------------
# 5. Função auxiliar: comunicar com o Ollama local
# ----------------------------------------------------------
def chamar_ollama(sintomas: str) -> str:
    """
    Envia os sintomas ao Ollama e devolve a resposta da IA.

    Args:
        sintomas: Texto descrevendo os sintomas do utente

    Returns:
        Texto com a análise de triagem da IA
    """

    # URL da API do Ollama (corre localmente)
    url = "http://localhost:11434/api/chat"

    # Corpo do pedido no formato que o Ollama espera
    payload = {
        "model": "llama3",       # Modelo a usar (deve estar instalado no Ollama)
        "stream": False,          # False = aguarda resposta completa antes de devolver
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": f"Analisa estes sintomas e faz a triagem: {sintomas}"
            }
        ]
    }

    try:
        # Timeout de 60 segundos (modelos locais podem demorar)
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()  # Lança exceção se o status não for 200

        # Extrair o texto da resposta do Ollama
        dados = response.json()
        return dados["message"]["content"]

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível ligar ao Ollama. Certifique-se que está em execução."
        )
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="O modelo demorou demasiado a responder. Tente novamente."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao comunicar com o modelo de IA: {str(e)}"
        )

# ----------------------------------------------------------
# 6. Endpoint principal: POST /triagem
# Recebe os sintomas e devolve a análise de triagem
# ----------------------------------------------------------
@app.post("/triagem")
async def fazer_triagem(pedido: PedidoTriagem):
    """
    Endpoint de triagem médica preliminar.

    Recebe:
        JSON com campo "sintomas" (string)

    Devolve:
        JSON com campo "resposta" (string com análise da IA)
    """
    # Chamar o Ollama com os sintomas validados
    resposta_ia = chamar_ollama(pedido.sintomas)

    # Devolver a resposta ao frontend React
    return {"resposta": resposta_ia}

# ----------------------------------------------------------
# 7. Endpoint de saúde: GET /health
# Útil para verificar se o servidor está a correr
# ----------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "servico": "TRIA-Home API"}

# ----------------------------------------------------------
# 8. Endpoint raiz: GET /
# ----------------------------------------------------------
@app.get("/")
def root():
    return {
        "projeto": "TRIA-Home",
        "versao": "1.0.0",
        "docs": "Aceda a /docs para ver a documentação interativa da API"
    }
