# Gestão Jurídica — PWA

App de gestão de clientes, procedimentos-base e casos, no mesmo formato dos seus outros apps: HTML/JS puro, sem build, direto no GitHub Pages.

## Como subir

1. Suba **todos os arquivos desta pasta** (mantendo a estrutura, tudo na raiz) para o repositório no GitHub.
2. Ative o GitHub Pages apontando para a branch/pasta onde estão os arquivos.
3. Abra o site — ele já funciona a partir do `index.html`.

## Firebase

Já vem configurado com as credenciais do projeto `ajuste-financeiro` (o mesmo que os outros apps usam). Não precisa editar `cloud-sync.js`.

Único passo no Console (se ainda não tiver feito pros outros apps): em **Authentication → método E-mail/senha**, garantir que está ativado. E colar o conteúdo de `firestore.rules` nas regras do Firestore — ele usa a coleção própria `advocacia_usuarios`, isolada dos outros apps do mesmo projeto.

Pronto — é só criar uma conta na tela de login do próprio app e usar.

## O que o app já faz

- Login/criação de conta (e-mail e senha)
- **Clientes**: cadastro completo, documentos, anotações, histórico, casos vinculados
- **Procedimentos-base**: informações gerais, checklist modelo, documentos necessários (com "onde conseguir"), conhecimentos incorporados, casos vinculados
- **Casos**: criados a partir de cliente + procedimento, com checklist copiado automaticamente do modelo; status, próxima ação, prazo, documentos, anotações, histórico
- **Lições aprendidas**: registradas em cada caso; "Incorporar ao procedimento" grava a lição no procedimento-base e, se houver sugestão, adiciona automaticamente um novo item ao checklist modelo
- **Busca** global (clientes, casos, procedimentos)
- **Contatos úteis** (cartórios, peritos, parceiros)
- **Painel inicial** com casos ativos e prazos próximos
- Instalável como PWA, com cache básico offline dos arquivos do app (os dados em si dependem de conexão com o Firestore, com cache local do próprio SDK)

## Estrutura

```
index.html      → shell + todo o CSS
app.js          → toda a lógica do app (rotas, telas, ações)
cloud-sync.js   → Firebase (login e leitura/escrita no Firestore)
sw.js           → service worker (PWA)
manifest.json   → metadados do PWA
icon-192.png / icon-512.png
firestore.rules → regras de segurança para colar no Console
```

Sem etapa de build: é só editar e subir.
