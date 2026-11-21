# Central de Avaliações RSA Digital

Aplicação para consultar avaliações do Google Business Profile e publicar respostas, com uma integração MCP remota para Claude.

## Componentes

- Central web existente: OAuth online no navegador, consulta e publicação manual.
- MCP remoto: `/api/mcp`, com autenticação Bearer.
- OAuth Google offline: `/api/google/connect` e `/api/google/callback`.
- Supabase: guarda somente o refresh token Google criptografado com AES-256-GCM.
- Vercel: executa as rotas e mantém os segredos do servidor.

## Publicações no Google

A central web também permite publicar imagens usando links públicos HTTPS, sem transferir o armazenamento do Manus:

- Galeria: `POST /api/media`, com `locationName`, `sourceUrl` e categoria.
- Atualização: `POST /api/local-posts`, com `locationName`, `sourceUrl`, texto e botão opcional.
- As duas rotas recebem o access token Google da sessão do navegador no cabeçalho Bearer.
- A interface exige confirmação explícita antes de cada publicação.
- Para postagens locais, a imagem precisa estar acessível publicamente por HTTPS. O texto é enviado como postagem padrão (`STANDARD`).

## Ferramentas MCP

- `list_locations`: lista todas as fichas acessíveis.
- `list_unanswered_reviews`: consulta avaliações pendentes em todas as fichas ou em uma ficha específica.
- `publish_replies`: publica um lote de até 25 respostas, revalidando cada avaliação antes de publicar e pulando as que já receberam resposta.

A ferramenta de publicação deve ser chamada somente depois da aprovação explícita do usuário sobre o conteúdo do lote.

## Supabase

Crie um projeto dedicado e execute `supabase/schema.sql` no SQL Editor. A tabela tem RLS habilitado e não concede acesso a `anon` ou `authenticated`; somente o backend usa a chave de serviço.

## Variáveis de ambiente na Vercel (Production)

Mantenha a variável existente:

- `GOOGLE_CLIENT_ID`: OAuth Client ID já cadastrado.

Adicione:

- `GOOGLE_CLIENT_SECRET`: segredo do mesmo OAuth Client ID (Google Cloud Console).
- `GOOGLE_REDIRECT_URI`: URL exata `https://rsa-avaliacoes-google.vercel.app/api/google/callback`.
- `GOOGLE_CONNECT_SECRET`: senha longa para iniciar a conexão Google em `/api/google/connect`.
- `OAUTH_STATE_SECRET`: segredo aleatório longo usado para assinar o estado OAuth.
- `TOKEN_ENCRYPTION_KEY`: chave base64 de exatamente 32 bytes para criptografar o refresh token.
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço/secret do Supabase, somente no servidor.
- `MCP_API_KEY`: segredo Bearer longo que protege o endpoint MCP.

Gere valores aleatórios fortes para os quatro segredos locais com um gerenciador de senhas ou terminal. Exemplo em macOS/Linux:

```bash
openssl rand -hex 32
openssl rand -base64 32
```

Use uma chave diferente para cada variável. Para `TOKEN_ENCRYPTION_KEY`, use a saída base64 de `openssl rand -base64 32`.

## Google Cloud Console

No OAuth Client ID do tipo Aplicativo da Web, adicione aos URIs de redirecionamento autorizados:

```
https://rsa-avaliacoes-google.vercel.app/api/google/callback
```

O escopo utilizado é `https://www.googleapis.com/auth/business.manage`. O fluxo solicita acesso offline e consentimento para obter refresh token.

## Conectar a conta Google

1. Configure todas as variáveis de ambiente acima na Vercel.
2. Abra `https://rsa-avaliacoes-google.vercel.app/api/google/connect`.
3. Informe o valor de `GOOGLE_CONNECT_SECRET` no formulário.
4. Autorize a conta Google que gerencia as fichas.
5. Confirme a página de sucesso.

O refresh token é criptografado antes de ser enviado ao Supabase.

## Conectar o Claude

No Claude: Customize → Connectors → Add custom connector.

- Nome: RSA Digital – Avaliações Google
- URL: `https://rsa-avaliacoes-google.vercel.app/api/mcp`
- Autenticação: sem OAuth (No sign in), com cabeçalho fixo.
- Cabeçalho: `Authorization`
- Valor: `Bearer <MCP_API_KEY>`

Ative o conector na conversa. O Claude poderá listar fichas, consultar avaliações e publicar respostas em lote após sua aprovação.

## Segurança e operação

- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`, refresh token ou `MCP_API_KEY` no navegador ou no Git.
- O endpoint MCP só aceita chamadas com o Bearer correto.
- A publicação reconsulta a avaliação para evitar responder novamente uma avaliação que já foi atendida.
- Se o refresh token for revogado, refaça a autorização em `/api/google/connect`.
- O projeto Vercel precisa permitir acesso público ao endpoint MCP. Se a proteção SSO/deployment protection estiver ativa no domínio `vercel.app`, o Claude não conseguirá alcançá-lo. Mantenha a proteção desativada apenas para este projeto e use a autenticação Bearer do MCP; não desative proteções de outros projetos.
- O diretório raiz da Vercel deve continuar como `src`.
