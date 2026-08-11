# Gestão Jurídica — PWA

Aplicativo de gestão de clientes, casos e conhecimento jurídico, construído em React + Vite + Firebase.

## Publicação automática no GitHub Pages

Este projeto já vem com um workflow (`.github/workflows/deploy.yml`) que builda e publica
o site sozinho, sempre que algo é enviado para a branch `main`. Depois de subir os arquivos
para o repositório, é só ativar uma vez:

1. No repositório, vá em **Settings > Pages**.
2. Em **Build and deployment > Source**, escolha **GitHub Actions**.
3. Volte para a aba **Actions** do repositório e acompanhe o workflow "Publicar no GitHub Pages".
   Ao terminar (ícone verde), o endereço do site aparece em Settings > Pages, algo como:
   `https://jcaferreira00-dev.github.io/Adv/`

A partir daí, qualquer novo envio de arquivos para o repositório publica uma nova versão
automaticamente — sem precisar rodar nenhum comando na sua máquina.

## Modo de teste (sem Firebase configurado)

Na tela de login existe um botão discreto **"Ferramentas"**. Ao abri-lo, aparece a opção
**"Entrar em modo de teste"**. Esse modo permite navegar por todas as telas do sistema
mesmo sem o Firebase estar configurado — os dados ficam salvos apenas no navegador
(localStorage), não são sincronizados com nada, e servem só para você experimentar o
sistema e ver o funcionamento antes de conectar sua conta real.

## Como conectar ao seu projeto Firebase (para uso real, com sincronização)

1. No Console do Firebase, ative os produtos: Authentication (método E-mail/senha), Firestore Database e Storage.
2. Copie as credenciais do seu app web (Configurações do projeto > Geral > Seus apps).
3. Abra o arquivo `src/firebase/config.js` e substitua os valores de `firebaseConfig` pelos do seu projeto.
4. Publique as regras de segurança:
   - `firestore.rules` no Firestore.
   - `storage.rules` no Storage.
   (Pode colar o conteúdo direto no editor de regras do Console.)
5. Envie a alteração para o GitHub — a publicação acontece sozinha, como descrito acima.

## Rodando localmente (opcional)

```
npm install
npm run dev
```

## O que já está funcionando nesta versão

- Login e criação de conta (e-mail/senha), além do modo de teste local
- Clientes: cadastro completo, documentos, anotações, histórico, casos vinculados
- Procedimentos-base: informações gerais, checklist modelo, documentos necessários (com "onde conseguir"), casos vinculados
- Casos: criados a partir de um cliente + um procedimento, com checklist copiado automaticamente do procedimento-base, status, próxima ação, prazo, documentos, anotações, histórico
- Lições aprendidas: registradas em cada caso, com opção de "incorporar ao procedimento"
- Busca global simples (clientes, casos, procedimentos)
- Contatos úteis
- Painel inicial com casos ativos, prazos próximos e contadores animados
- Instalável como aplicativo (PWA) no celular e no computador
- Publicação automática via GitHub Actions

## O que ainda não está nesta versão (fica para depois, como combinado)

- Inteligência artificial (resumos, sugestões automáticas)
- Controle de múltiplos usuários/equipe
- Regras de segurança mais refinadas por tipo de dado
