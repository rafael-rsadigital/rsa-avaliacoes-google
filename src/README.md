# Central de Avaliações RSA Digital

Aplicação simples para consultar avaliações do Google Business Profile e publicar respostas.

## Funcionamento
- OAuth Google com acesso on-line (sem refresh token).
- O access token fica somente na memória da página.
- O backend não persiste tokens nem avaliações.
- APIs utilizadas: Business Information API v1 e Google My Business API v4.

## Configuração
1. No Google Cloud, configure a tela de consentimento OAuth.
2. Crie um OAuth Client ID do tipo Aplicativo da Web.
3. Cadastre a URL de produção como origem JavaScript autorizada.
4. Adicione a variável de ambiente GOOGLE_CLIENT_ID na Vercel.
5. Ative Business Information API e Google My Business API no projeto Google Cloud.

## Implantação na Vercel
O diretório raiz do projeto na Vercel deve permanecer configurado como `src`, pois é nele que ficam o `index.html` e a pasta `api`.

O token é solicitado a cada sessão e expira. O usuário pode reconectar quando necessário.
