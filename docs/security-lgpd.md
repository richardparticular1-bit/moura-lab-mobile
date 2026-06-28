# Seguranca e LGPD

## Fundacao implementada

- Consentimento LGPD no cadastro do paciente.
- Data e origem do aceite.
- Senhas preparadas para BCrypt.
- Modelo de usuarios, papeis e auditoria.
- HTTPS obrigatorio em producao.
- Logs de auditoria previstos para entidades sensiveis.

## Regras operacionais

- Nunca disparar campanha para paciente sem consentimento.
- Nunca usar a Moura IA para diagnostico.
- Registrar interacoes relevantes no CRM.
- Separar pesquisa interna de satisfacao do pedido publico de avaliacao.
- Fazer backup diario do PostgreSQL em producao.

## Proximas implementacoes

- Guard de autenticacao JWT.
- RBAC por perfil: administrador, recepcao, dentista e financeiro.
- Criptografia de campos sensiveis quando necessario.
- Retencao e anonimizacao de dados.
- Assinatura e validacao de payloads da Meta WhatsApp.
