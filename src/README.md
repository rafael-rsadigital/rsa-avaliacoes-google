# Central de Avaliações RSA Digital

Aplicação para consultar avaliações do Google Business Profile e publicar respostas, com uma integração MCP remota para Claude.

## Componentes

- Central web existente: OAuth online no navegador, consulta e publicação manual.
- MCP remoto: `/api/mcp`, com autenticação Bearer.
- OAuth Google offline: `/api/google/connect` e `/api/google/callback`.
- Supabase: guarda refresh tokens Google criptografados com AES-256-GCM.
- Vercel: executa as rotas e mantém os segredos do servidor.

## Múltiplas contas Google

A conexão Google usada pela MCP agora aceita várias contas:

1. Abra `https://rsa-avaliacoes-google.vercel.app/api/google/connect`.
2. Informe a chave `GOOGLE_CONNECT_SECRET` e um rótulo para identificar a conta (ex.: "Gmail Mcqueen").
3. Autorize no Google a conta que gerencia as fichas desejadas.
4. Repita o processo para cada Gmail adicional. A conexão principal existente é preservada.

No Claude, chame `list_google_accounts` para obter os identificadores `accountKey`. A ferramenta `list_locations` lista fichas de todas as contas e informa `accountKey` e `accountLabel` em cada resultado. `list_unanswered_reviews` também devolve esses campos; ao publicar, preserve o `accountKey` correspondente em cada item de `publish_replies`.

Se houver uma conta marcada como principal, chamadas antigas sem `accountKey` continuam usando essa conta. Se não houver conta principal e existir apenas uma conexão, ela será selecionada automaticamente. Com várias contas e sem principal, informe o `accountKey`.

**Importante:** o Bearer `MCP_API_KEY` continua sendo a chave de acesso geral do servidor. Todas as contas conectadas ficam disponíveis para quem possuir essa chave. Esta versão atende ao uso pessoal/da equipe RSA Digital; antes de oferecer acesso separado a clientes, será necessário implementar credenciais MCP individuais e isolamento por cliente.

## Publicações no Google

A central web também permite publicar imagens usando links públicos HTTPS, sem transferir o armazenamento do Manus:

- Galeria: `POST /api/media`, com `locationName`, `sourceUrl` e categoria.
- Atualização: `POST /api/local-posts`, com `locationName`, `sourceUrl`, texto e botão opcional.
- As duas rotas recebem o access token Google da sessão do navegador no cabeçalho Bearer.
- A interface exige confirmação explícita antes de cada publicação.
- Para postagens locais, a imagem precisa estar acessível publicamente por HTTPS. O texto é enviado como postagem padrão (`STANDARD`).

## Ferramentas MCP

- `list_google_accounts`: lista as contas Google autorizadas e seus identificadores.
- `list_locations`: lista fichas de todas as contas ou de uma conta específica.
- `list_unanswered_reviews`: consulta avaliações pendentes em todas as contas ou em uma conta/ficha específica.
- `publish_replies`: publica um lote de até 25 respostas, selecionando a conta indicada em cada item, revalidando cada avaliação e pulando as que já receberam resposta.

A ferramenta de publicação deve ser chamada somente depois da aprovação explícita do usuário sobre o conteúdo do lote.

## Supabase

Crie um projeto dedicado e execute `supabase/schema.sql` no SQL Editor. O script cria as tabelas com RLS habilitado, bloqueia acesso de `anon` e `authenticated` e concede acesso somente a `service_role`. A conexão original é copiada para a tabela multi-conta sem remover a tabela antiga.

## Variáveis de ambiente na Vercel (Production)

Mantenha as variáveis existentes:

- `GOOGLE_CLIENT_ID`: OAuth Client ID já cadastrado.
- `GOOGLE_CLIENT_SECRET`: segredo do mesmo OAuth Client ID.
- `GOOGLE_REDIRECT_URI`: URL exata `https://rsa-avaliacoes-google.vercel.app/api/google/callback`.
- `GOOGLE_CONNECT_SECRET`: senha longa para iniciar a conexão Google.
- `OAUTH_STATE_SECRET`: segredo aleatório longo usado para assinar o estado OAuth.
- `TOKEN_ENCRYPTION_KEY`: chave base64 de exatamente 32 bytes para criptografar os refresh tokens.
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço/secret do Supabase, somente no servidor.
- `MCP_API_KEY`: segredo Bearer longo que protege o endpoint MCP.

Nenhuma variável nova é necessária para múltiplas contas.

## Google Cloud Console

No OAuth Client ID do tipo Aplicativo da Web, mantenha o URI de redirecionamento autorizado:

```
https://rsa-avaliacoes-google.vercel.app/api/google/callback
```

O escopo utilizado é `https://www.googleapis.com/auth/business.manage`. O fluxo solicita acesso offline e consentimento para obter refresh token.

## Conectar o Claude

No Claude: Customize → Connectors → Add custom connector.

- Nome: RSA Digital – Avaliações Google
- URL: `https://rsa-avaliacoes-google.vercel.app/api/mcp`
- Autenticação: sem OAuth (No sign in), com cabeçalho fixo.
- Cabeçalho: `Authorization`
- Valor: `Bearer <MCP_API_KEY>`

Ative o conector na conversa. Consulte `list_google_accounts` para identificar as contas e use o `accountKey` retornado para operar na conta desejada.

## Segurança e operação

- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`, refresh token ou `MCP_API_KEY` no navegador ou no Git.
- O endpoint MCP só aceita chamadas com o Bearer correto.
- Os refresh tokens ficam criptografados no banco; cada conta possui um identificador e um rótulo.
- A publicação reconsulta a avaliação para evitar responder novamente uma avaliação que já foi atendida.
- Se um refresh token for revogado, refaça a autorização daquela conta em `/api/google/connect`.
- O projeto Vercel precisa permitir acesso público ao endpoint MCP. Se a proteção SSO/deployment protection estiver ativa no domínio `vercel.app`, o Claude não conseguirá alcançá-lo. Mantenha a proteção desativada apenas para este projeto e use a autenticação Bearer do MCP; não desative proteções de outros projetos.
- O diretório raiz da Vercel deve continuar como `src`.
