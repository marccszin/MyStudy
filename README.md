# 📚 StudyHub

Link online: https://marccszin.github.io/MyStudy/

Uma central pessoal de estudos e produtividade: organize matérias, notas, tarefas, links e vídeos em um só lugar — direto no navegador, sem servidor, sem cadastro.

> Projeto pensado tanto como peça de portfólio quanto como ferramenta real de uso diário.

---

## ✨ Funcionalidades

- **Dashboard** com saudação dinâmica, cards de resumo (tarefas pendentes/concluídas, notas, links, vídeos e destaques), próximas tarefas, "assistir depois" e itens destacados.
- **Matérias**: crie, renomeie, escolha um ícone e exclua espaços de estudo (ex: Desenvolvimento, Química, Matemática). Cada matéria reúne suas próprias notas, tarefas, links e vídeos.
- **Notas**: editor com título, matéria, etiquetas, negrito, itálico, listas, links, destaque de texto e blocos de código. Permite fixar no topo e marcar como importante. Totalmente pesquisável.
- **Tarefas**: título, descrição, matéria, prioridade (alta/média/baixa), prazo e etiquetas. Filtros por status, prioridade e matéria, com feedback visual ao concluir.
- **Links**: uma biblioteca de referências — cole uma URL e adicione título, descrição, categoria e tags. Vira um cartão visual com abertura segura em nova aba.
- **Vídeos**: salve links do YouTube; o app extrai o ID automaticamente e gera a miniatura. Estados de "não assistido", "assistindo" e "concluído", com área dedicada a "Assistir depois".
- **Destaques**: qualquer nota, tarefa, link ou vídeo marcado com ⭐ aparece automaticamente reunido em uma página só.
- **Agenda**: visão das tarefas com prazo, agrupadas por dia, incluindo destaque para tarefas atrasadas.
- **Pesquisa global**: busca em notas, tarefas, links, vídeos e matérias ao mesmo tempo, com resultados agrupados.
- **Configurações**: alternância de tema claro/escuro, exportação e importação de dados em JSON (com validação do arquivo) e opção de apagar todos os dados.
- **Tema claro/escuro** com preferência salva.
- **Totalmente responsivo**: sidebar fixa no desktop e menu retrátil no celular, sem depender de recarregar a página.
- **PWA**: pode ser instalado no computador ou celular e funciona offline para a navegação básica (o carregamento de miniaturas de vídeo e fontes externas depende de conexão).

## 🧱 Tecnologias utilizadas

- HTML5 semântico
- CSS3 (variáveis nativas, grid, flexbox)
- JavaScript ES6+ (módulos via IIFE, sem framework e sem etapa de build)
- LocalStorage para persistência de dados
- Web App Manifest + Service Worker (PWA)

Nenhuma dependência externa é necessária para rodar o projeto — apenas a fonte é carregada via Google Fonts (com fallback para fontes do sistema caso esteja offline).

## 🗂️ Estrutura de arquivos

```
studyhub/
├── index.html              # Estrutura da aplicação (shell, sidebar, modais)
├── manifest.json            # Manifesto do PWA
├── sw.js                    # Service worker (cache do app shell)
├── css/
│   └── style.css            # Design system e estilos de todas as telas
├── js/
│   ├── utils.js              # Funções auxiliares (datas, ids, toasts, sanitização, YouTube)
│   ├── storage.js            # Modelo de dados e persistência em LocalStorage
│   ├── render.js              # Geração de HTML de cada tela e cartão
│   └── app.js                  # Estado, roteamento, modais de CRUD e eventos
├── assets/
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── README.md
```

## ▶️ Como executar localmente

Como o projeto usa `fetch`/Service Worker, é recomendado servir os arquivos por um servidor local em vez de abrir o `index.html` diretamente com `file://`.

Com Python:

```bash
cd studyhub
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080` no navegador.

Com a extensão **Live Server** do VS Code, ou qualquer outro servidor estático simples, também funciona normalmente.

## 🚀 Como publicar no GitHub Pages

1. Crie um repositório no GitHub e envie todos os arquivos deste projeto para a raiz dele (ou para uma subpasta, como `/portfolio`).
2. No repositório, vá em **Settings → Pages**.
3. Em **Source**, selecione a branch (ex: `main`) e a pasta (`/root` ou `/docs`, dependendo de onde os arquivos estão).
4. Salve e aguarde a publicação. O GitHub mostrará o endereço final, algo como:
   `https://usuario.github.io/studyhub/`
5. Todos os caminhos do projeto (CSS, JS, ícones, manifest) usam referências **relativas** (`./`), então o StudyHub funciona corretamente mesmo publicado em um subdiretório do domínio do GitHub Pages.

## 🧭 Como utilizar

1. Ao abrir pela primeira vez, o StudyHub carrega alguns dados de exemplo para você explorar a interface.
2. Use o botão **"＋ Novo"** no topo (ou o menu lateral) para criar matérias, notas, tarefas, links e vídeos.
3. Marque itens com ⭐ para encontrá-los rapidamente na página **Destaques**.
4. Use a barra de pesquisa no topo para buscar em todo o conteúdo salvo.
5. Em **Configurações**, exporte um backup em JSON periodicamente — os dados ficam salvos apenas no navegador utilizado.

## ⚠️ Limitações atuais

- Os dados são armazenados **apenas no navegador local** (LocalStorage); não há sincronização entre dispositivos ou backup automático em nuvem.
- Miniaturas de vídeos e ícones de sites (favicons) dependem de conexão com a internet, mesmo com o app instalado como PWA.
- A extração automática de metadados (thumbnail/ID) funciona apenas para links do YouTube; outras plataformas de vídeo são salvas normalmente, mas sem miniatura.
- O editor de notas usa uma abordagem simples de formatação (`contenteditable`), sem suporte a colar imagens ou anexos.
- Exportação/importação usam arquivos `.json`; não há checagem de versão para merges parciais — a importação substitui todos os dados atuais.

## 💡 Ideias futuras

- Sincronização opcional via conta (ex: Google Drive, Firebase) mantendo o LocalStorage como modo offline padrão.
- Editor de notas mais completo (Markdown ou rich text real, com suporte a imagens).
- Suporte a anexos de arquivos e PDFs nas matérias.
- Modo de revisão espaçada (flashcards) vinculado às anotações.
- Estatísticas de estudo (tempo, sequência de dias, progresso por matéria).
- Compartilhamento de matérias entre dispositivos via QR code ou link.

---

Feito com HTML, CSS e JavaScript puros — sem frameworks, sem build step, pronto para o GitHub Pages.
