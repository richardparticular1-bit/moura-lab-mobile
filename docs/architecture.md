# Arquitetura

## Objetivo

Centralizar comunicacao, agenda, CRM, IA de atendimento, marketing, pesquisa de satisfacao, gestao de avaliacoes e indicadores da Moura Odontologia & Associados.

## Visao macro

```text
Paciente
  -> WhatsApp Business API
  -> Gateway Conversacional / API NestJS
  -> Orquestracao IA + Fluxos n8n
  -> CRM / Agenda / Marketing / Reviews
  -> PostgreSQL + Redis + Qdrant
  -> Dashboard Web
```

## Decisoes iniciais

- Backend: NestJS modular para separar dominios e permitir crescimento por equipe.
- Banco operacional: PostgreSQL, com Prisma para modelagem e migracoes.
- Cache e filas futuras: Redis.
- Base vetorial: Qdrant local em desenvolvimento, substituivel por Pinecone em producao.
- Automacao: n8n acionado por webhooks de dominio.
- IA: OpenAI com guardrails clinicos e proibicao explicita de diagnostico.

## Fronteiras

- `chatbot` recebe mensagens e decide a rota.
- `patients` concentra identidade, consentimento e status do paciente.
- `appointments` gerencia agenda e confirmacoes.
- `interactions` registra cada contato com rastreabilidade.
- `reviews` separa satisfacao interna de pedido publico de avaliacao.
- `campaigns` controla segmentacao, consentimento e metricas.

## Proximas camadas

- Dashboard web com RBAC por perfil.
- Workers para lembretes, campanhas e integracoes.
- BI com eventos agregados.
- Portal do paciente e teleorientacao.
