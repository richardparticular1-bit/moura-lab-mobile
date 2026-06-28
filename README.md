# Moura Odontologia & Associados - Plataforma de Relacionamento com Pacientes

Base inicial para uma plataforma propria de relacionamento com pacientes, preparada para WhatsApp, CRM, agenda, IA assistiva, marketing, pesquisas de satisfacao, avaliacoes e indicadores gerenciais.

## Estrutura

```text
apps/
  api/                 Backend principal e gateway conversacional em NestJS
  web/                 Dashboard administrativo em React/Vite
packages/
  shared/              Espaco reservado para contratos compartilhados
apps/api/prisma/       Schema do banco de dados
docs/                  Decisoes de arquitetura e roadmap tecnico
```

## Primeiros comandos

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
npm run dev:web
```

## Instalar o app de sensores no celular

O app em `apps/web` funciona como PWA instalavel, mas celulares exigem contexto seguro.
Abrir por `http://192.168.x.x` serve apenas para visualizar a tela; camera, microfone,
GPS, sensores e o prompt de instalacao podem ficar bloqueados.

Para instalar e testar os sensores no aparelho, publique o build em HTTPS:

```bash
npm run build:web
```

### Cloudflare Pages

No painel do Cloudflare Pages, configure:

- Build command: `npm run build:web`
- Build output directory: `apps/web/dist`
- Root directory: deixe vazio se o repositorio inteiro for enviado
- Node.js version: `20` ou superior

Depois do deploy, abra a URL `https://...pages.dev` no celular. No Android, use Chrome
e toque em `Instalar app`. No iPhone, use Safari e toque em `Compartilhar > Adicionar
a Tela de Inicio`.

O arquivo `apps/web/public/_headers` libera as politicas de camera, microfone,
geolocalizacao e sensores para o proprio dominio HTTPS do app.

## Modulos iniciais

- `patients`: CRM odontologico, consentimento LGPD e historico basico.
- `appointments`: agenda inteligente e status operacionais.
- `chatbot`: webhook de WhatsApp e orquestracao da Moura IA.
- `interactions`: registro auditavel das conversas.
- `campaigns`: segmentacao e disparos de marketing.
- `reviews`: pesquisa de satisfacao e fluxo de avaliacao Google.
- `auth`: base para usuarios, papeis e seguranca.

## Principios clinicos da Moura IA

- Linguagem acolhedora e humanizada.
- Promocao de saude e encaminhamento rapido.
- Sem diagnostico automatizado.
- Triagem por urgencia, prioridade e direcionamento.
- Supervisao clinica do Dr. Richard Colaco de Moura.
