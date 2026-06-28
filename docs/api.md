# API Inicial

Prefixo: `/api/v1`

## Saude

- `GET /health`

## Pacientes

- `POST /patients`
- `GET /patients?q=texto`
- `GET /patients/:id`
- `PATCH /patients/:id`

Campos principais: `name`, `phone`, `email`, `birthDate`, `city`, `source`, `status`, `lgpdConsentAccepted`.

## Agenda

- `POST /appointments`
- `GET /appointments?from=2026-01-01&to=2026-01-31`
- `PATCH /appointments/:id`

Status suportados: `SCHEDULED`, `CONFIRMED`, `RESCHEDULED`, `CANCELLED`, `ATTENDED`, `NO_SHOW`.

## WhatsApp

- `GET /webhooks/whatsapp`
- `POST /webhooks/whatsapp`

O webhook recebe mensagens da Meta, registra a interacao, aciona a Moura IA e responde pelo adaptador de WhatsApp.

## Campanhas

- `POST /campaigns`
- `GET /campaigns`
- `GET /campaigns/segments/:segment/patients`

Segmentos iniciais: `6-months-inactive`, `12-months-inactive`, `interrupted-treatment`.

## Avaliacoes

- `POST /reviews`
- `GET /reviews/metrics`

Regra inicial: nota 5 solicita avaliacao Google quando `GOOGLE_REVIEW_URL` estiver configurada; notas 1 a 4 abrem chamado interno.
