<a id="readme-top"></a>

<!-- ESCUDOS DO PROJETO -->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- LOGOTIPO DO PROJETO -->
<br />
<div align="center">
  <a href="https://github.com/alissonpef/marketplace_smart_filter">
    <img src="icons/icon128.png" alt="Marketplace Smart Filter Logo" width="100" height="100">
  </a>

  <h3 align="center">Marketplace Smart Filter</h3>

  <p align="center">
    Extensão para Google Chrome e navegadores Chromium (Brave, Edge, Opera) em Manifest V3 que transforma o Facebook Marketplace: filtra apenas o que realmente combina com sua busca, elimina acessórios indesejados, marca anúncios novos e alerta preços suspeitos de golpes.
    <br />
    <a href="https://github.com/alissonpef/marketplace_smart_filter"><strong>Explore a documentação »</strong></a>
    <br />
    <br />
    <a href="https://github.com/alissonpef/marketplace_smart_filter/issues/new?labels=bug">Reportar Bug</a>
    &middot;
    <a href="https://github.com/alissonpef/marketplace_smart_filter/issues/new?labels=enhancement">Solicitar Recurso</a>
  </p>
</div>

<!-- ÍNDICE -->
<details>
  <summary>Índice</summary>
  <ol>
    <li>
      <a href="#sobre-o-projeto">Sobre O Projeto</a>
      <ul>
        <li><a href="#principais-destaques">Principais Destaques</a></li>
        <li><a href="#construído-com">Construído Com</a></li>
      </ul>
    </li>
    <li>
      <a href="#começando">Começando</a>
      <ul>
        <li><a href="#pré-requisitos">Pré-requisitos</a></li>
        <li><a href="#instalação-no-navegador">Instalação no Navegador</a></li>
        <li><a href="#ambiente-de-desenvolvimento">Ambiente de Desenvolvimento</a></li>
      </ul>
    </li>
    <li><a href="#como-usar">Como Usar</a></li>
    <li><a href="#arquitetura-do-projeto">Arquitetura do Projeto</a></li>
    <li><a href="#testes-e-qualidade-de-código">Testes e Qualidade de Código</a></li>
    <li><a href="#privacidade--segurança">Privacidade & Segurança</a></li>
    <li><a href="#contribuindo">Contribuindo</a></li>
    <li><a href="#licença">Licença</a></li>
    <li><a href="#contato">Contato</a></li>
  </ol>
</details>

<!-- SOBRE O PROJETO -->

## Sobre O Projeto

Quem já buscou um produto específico no **Facebook Marketplace** conhece a frustração: você pesquisa por um notebook específico como `"Dell G15"` e recebe centenas de resultados com capinhas, películas, carregadores, celulares `Motorola Moto G15`, modelos de outras marcas ou anúncios com valores irreais para chamar atenção no chat.

O **Marketplace Smart Filter** resolve isso diretamente na sua experiência de navegação. Construído com padrões modernos em **Manifest V3**, ele roda diretamente no navegador, analisa os cards em tempo real através do DOM, aplica regras semânticas de correspondência, calcula medianas estatísticas de preço e reorganiza a página para entregar exatamente aquilo que você procura.

### Principais Destaques

- 🎯 **Busca Inteligente e Semântica**:
  - Equivalência automática de modelos: `g15`, `g 15` e `g-15` são tratados como idênticos.
  - Suporte a sinônimos integrados e configuráveis (ex: `notebook = laptop`, `celular = smartphone`, `bicicleta = bike`).
  - Tolerância a plurais e erros leves de digitação (distância de edição Levenshtein de até 1 caractere).
  - Sintaxe avançada de operadores: exclua termos com o sinal de menos (ex: `-moto`) e exija expressões exatas com aspas duplas (ex: `"g15 gamer"`).
  - Modos de correspondência: **Estrita** (exige todas as palavras) ou **Inteligente** (exige o modelo principal e flexibiliza as demais palavras).

- 🛡️ **Filtro Automático de Acessórios**:
  - Ignora automaticamente capas, capinhas, cases, películas, carregadores, cabos, suportes, peças e sucatas quando você está buscando o aparelho principal. A lista de palavras-chave de acessórios é totalmente editável nas opções.

- ⚠️ **Detecção de Preço Suspeito (Anti-Golpe)**:
  - Coleta os preços dos anúncios relevantes na listagem atual e calcula a **mediana real**.
  - Alerta visualmente anúncios com valor abaixo de **50% da mediana** (requer quorum mínimo de 5 anúncios), ajudando a evitar anúncios falsos, golpes ou preços simbólicos (como R$ 1 ou R$ 123).

- ⏱️ **Controle de Visitas e Anúncios Novos**:
  - Marca anúncios publicados ou descobertos desde a sua última visita àquela busca específica.
  - Filtro opcional _"Apenas novos"_: esmaece ou oculta itens já vistos em sessões anteriores.
  - Esmaecimento automático de anúncios em que você já clicou para abrir.
  - Ocultação manual de qualquer anúncio indesejado com 1 clique (com botão de desfazer no painel).

- 🔍 **Leitura de Descrições em Segundo Plano (Opcional)**:
  - Quando ativado, inspeciona em background anúncios cujo título não continha os termos, resgatando itens relevantes onde o modelo foi informado na descrição.
  - Possui fila assíncrona educada (rate-limiting), detecção de redirecionamento de login e cache local com expiração.
  - Filtro semântico inteligente: ignora anúncios de quem quer comprar ou trocar (ex: _"aceito Dell G15 na troca"_).

- 📊 **Ordenação Visual de Resultados**:
  - Permite ordenar os anúncios por preço (crescente ou decrescente) via flex/grid CSS sem quebrar a paginação nativa do Facebook. Os itens que combinam ficam no topo e os irrelevantes são enviados para o fim.

- 🎨 **Painel Flutuante Integrado & Popup Rápido**:
  - Painel expansível embutido na própria página via Shadow DOM (isolamento completo de estilos).
  - Popup de ação rápida na barra de ferramentas da extensão.
  - Suporte automático e manual aos modos Claro e Escuro (usando a paleta de cinzas nativa do Facebook).
  - Atalho global rápido: <kbd>Alt+Shift+F</kbd> liga e desliga o filtro instantaneamente.

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

### Construído Com

Esta seção lista as principais tecnologias e bibliotecas utilizadas no desenvolvimento do projeto:

- [![JavaScript][JavaScript-shield]][JavaScript-url]
- [![Chrome][Chrome-shield]][Chrome-url]
- [![Node.js][NodeJS-shield]][NodeJS-url]
- [![Prettier][Prettier-shield]][Prettier-url]
- **Chrome Extensions API (Manifest V3)** - Service Worker (`background.js`), Content Scripts e `chrome.storage`
- **Shadow DOM & CSS Custom Properties** - Isolamento completo da interface do painel
- **Node.js Test Runner (`node --test`)** - Execução nativa de testes unitários sem frameworks pesados
- **JSDOM** - Simulação de ambiente DOM do Facebook para testes de integração

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

<!-- COMEÇANDO -->

## Começando

Siga as instruções abaixo para instalar a extensão no seu navegador ou configurar o ambiente local de desenvolvimento.

### Pré-requisitos

- **Navegador**: Google Chrome, Brave, Microsoft Edge ou qualquer navegador baseado em Chromium (versão 105 ou superior).
- **Para desenvolvimento**: [Node.js](https://nodejs.org/) versão 20.x ou 22.x (LTS) e npm.

---

### Instalação no Navegador

1. **Baixe ou clone o repositório:**
   ```sh
   git clone https://github.com/alissonpef/marketplace_smart_filter.git
   ```
2. **Abra a página de extensões no seu navegador:**
   - Google Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Microsoft Edge: `edge://extensions`
3. Ative a opção **Modo do desenvolvedor** (Developer mode) no canto superior direito.
4. Clique no botão **Carregar sem compactação** (Load unpacked).
5. Selecione a pasta raiz deste repositório (onde se encontra o arquivo [manifest.json](file:///c:/Users/alisson/Desktop/Alisson/Programacao/marketplace_smart_filter/manifest.json)).
6. Pronto! A extensão estará instalada e pronta para uso. Acesse o Facebook Marketplace e faça qualquer pesquisa.

---

### Ambiente de Desenvolvimento

Para rodar os testes automatizados e formatar o código:

1. Clone o projeto e entre na pasta:
   ```sh
   git clone https://github.com/alissonpef/marketplace_smart_filter.git
   cd marketplace_smart_filter
   ```
2. Instale as dependências de desenvolvimento:
   ```sh
   npm install
   ```
3. Execute os testes unitários e de integração:
   ```sh
   npm test
   ```

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

<!-- COMO USAR -->

## Como Usar

Assim que você navegar para uma busca no Facebook Marketplace (ex: `https://www.facebook.com/marketplace/category/search/?query=dell%20g15`), o **Marketplace Smart Filter** entra em ação automaticamente.

### Sintaxe de Busca

Você pode refinar suas buscas na barra do próprio Facebook utilizando os operadores suportados:

| Padrão                | Exemplo                    | Comportamento                                                               |
| :-------------------- | :------------------------- | :-------------------------------------------------------------------------- |
| **Padrão / Flexível** | `dell g15`                 | Aceita variações como `Dell G-15`, `G 15` e títulos com pequenas variações. |
| **Exclusão**          | `dell g15 -moto -quebrado` | Descarta anúncios que contenham `moto` ou `quebrado`.                       |
| **Expressão Exata**   | `"g15 gamer"`              | Exige a sequência exata de palavras entre aspas no título/descrição.        |
| **Sinônimos**         | `laptop dell`              | Encontra anúncios cadastrados tanto com `laptop` quanto com `notebook`.     |

### Atalhos e Controles

- **Ligar/Desligar:** Pressione <kbd>Alt+Shift+F</kbd> a qualquer momento para alternar o filtro.
- **Painel Flutuante:** Um botão com ícone de filtro aparece fixo no canto inferior da página do Marketplace. Ao clicar, o painel exibe:
  - Quantidade de anúncios que combinam na listagem atual.
  - Status da primeira visita vs. anúncios novos.
  - Alternador de ordenação por preço (Menor primeiro / Maior primeiro).
  - Alternador de ação para anúncios que não combinam (Escurecer / Ocultar da grade).
  - Acesso rápido às configurações completas.
- **Popup da Extensão:** Clique no ícone da extensão na barra do navegador para alterar o modo de rigidez, ativar a leitura de descrições ou gerenciar palavras excluídas rapidamente.

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

<!-- ARQUITETURA DO PROJETO -->

## Arquitetura do Projeto

A extensão foi projetada com alta coesão e desacoplamento. A lógica de negócios é pura, sem amarras com APIs do navegador, o que viabiliza testes rápidos e confiáveis em Node.js:

```
marketplace_smart_filter/
├── manifest.json              # Configuração Manifest V3 da extensão
├── package.json               # Dependências de teste (jsdom, acorn, prettier)
├── icons/                     # Ícones em 16px, 48px e 128px
├── src/
│   ├── background.js          # Service Worker: atalho de teclado e abertura de opções
│   ├── core/                  # Módulos puros (zero DOM, testáveis em Node e browser)
│   │   ├── defaults.js        # Fonte única da verdade das configurações padrão
│   │   ├── matcher.js         # Motor de correspondência semântica, fuzzy e regras
│   │   ├── price.js           # Parser de preços (BRL) e cálculo estatístico da mediana
│   │   └── history.js         # Gerenciamento de histórico (vistos, abertos e ocultos)
│   ├── descriptions/          # Subsistema de inspeção de descrições
│   │   ├── parser.js          # Extração de descrição e metadados de páginas HTML
│   │   ├── cache.js           # Cache persistente com TTL e política LRU
│   │   └── fetcher.js         # Fila assíncrona educada (rate-limited)
│   └── content/               # Orquestração dentro da página do Facebook
│       ├── main.js            # Inicialização e observador de mutações (MutationObserver)
│       ├── dom.js             # Localização e extração de dados dos cards de produtos
│       ├── visits.js          # Gerenciamento de anúncios novos por consulta
│       ├── sorter.js          # Ordenação visual via flex/grid CSS order
│       ├── theme.js           # Detecção dinâmica de tema claro/escuro do Facebook
│       ├── highlight.js       # Realce com tags dos termos buscados nos títulos
│       ├── panel.js           # Painel flutuante encapsulado em Shadow DOM
│       └── content.css        # Estilos aplicados aos cards de anúncios
├── ui/                        # Sistema de design compartilhado (popup, painel, opções)
│   ├── tokens.css             # Paleta de cores, tipografia, espaçamentos e raios
│   ├── components.css         # Switches, controles segmentados, botões e campos
│   ├── panel.css              # Folha de estilos do painel flutuante
│   └── bind.js                # Conexão reativa bidirecional entre UI e chrome.storage
├── popup/                     # Interface do popup na barra de ferramentas
├── options/                   # Página completa de configurações da extensão
├── tests/                     # Bateria de testes automatizados com Node.js
└── tools/                     # Scripts de validação e verificação de integridade
```

> [!NOTE]
> Os seletores não dependem de classes ofuscadas do Facebook (que mudam a cada build). Todo o parsing baseia-se em atributos semânticos perenes, como URLs com o padrão `/marketplace/item/<id>` e parâmetros `query` de busca.

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

<!-- TESTES E QUALIDADE DE CÓDIGO -->

## Testes e Qualidade de Código

O projeto conta com uma suíte de testes unitários e de integração utilizando o runner nativo do Node.js (`node --test`), além de validações estritas de formatação e ausência de comentários em código de produção:

```sh
# Executar todos os testes
npm test

# Verificar formatação e conformidade (Lint completo)
npm run lint

# Verificar apenas formatação com Prettier
npm run lint:format

# Corrigir formatação automaticamente com Prettier
npm run format

# Verificar ausência de comentários em arquivos de produção
npm run lint:comments
```

### Integração Contínua (CI)

O repositório conta com pipeline automatizado via **GitHub Actions** ([.github/workflows/ci.yml](file:///.github/workflows/ci.yml)) que valida cada `push` e `pull request`:

- **Lint & Format Check:** Validação de estilo com Prettier e garantia de integridade com o comment linter.
- **Test Matrix:** Execução dos testes automatizados em ambientes Node.js 20.x e 22.x sobre Ubuntu.

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

<!-- PRIVACIDADE E SEGURANÇA -->

## Privacidade & Segurança

- 🔒 **100% Local:** Todo o processamento de filtragem, cálculos de preço e persistência ocorre exclusivamente no seu navegador via `chrome.storage`.
- 🚫 **Sem Rastreamento:** A extensão não coleta dados pessoais, não possui serviços de telemetria e **não envia nenhuma informação para servidores externos**.
- 🌐 **Permissões Mínimas:** Utiliza unicamente a permissão `"storage"`, limitando a injeção de scripts aos domínios do Facebook Marketplace.

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

<!-- CONTRIBUINDO -->

## Contribuindo

Contribuições são muito bem-vindas e fortalecem o projeto! Se você tem sugestões de novos recursos ou correções de bugs:

1. Faça um **Fork** do projeto
2. Crie uma branch para a sua funcionalidade (`git checkout -b feature/MinhaFuncionalidade`)
3. Faça o commit das suas alterações (`git commit -m 'feat: Adiciona nova funcionalidade'`)
4. Envie para a branch remota (`git push origin feature/MinhaFuncionalidade`)
5. Abra um **Pull Request**

Antes de abrir o PR, certifique-se de que os testes e linters estejam passando:

```sh
npm run format
npm run lint
npm test
```

### Contribuidores:

<a href="https://github.com/alissonpef/marketplace_smart_filter/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=alissonpef/marketplace_smart_filter" alt="Contribuidores do Marketplace Smart Filter" />
</a>

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

<!-- LICENÇA -->

## Licença

Distribuído sob a Licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

<!-- CONTATO -->

## Contato

**Alisson Pereira Ferreira** - [alissonpef@gmail.com](mailto:alissonpef@gmail.com) - [LinkedIn](https://www.linkedin.com/in/alisson-pereira-ferreira/)

Link do Projeto: [https://github.com/alissonpef/marketplace_smart_filter](https://github.com/alissonpef/marketplace_smart_filter)

<p align="right">(<a href="#readme-top">voltar ao topo</a>)</p>

---

Feito com ❤️ por **Alisson Pereira**.

<!-- LINKS E IMAGENS -->

[contributors-shield]: https://img.shields.io/github/contributors/alissonpef/marketplace_smart_filter.svg?style=for-the-badge
[contributors-url]: https://github.com/alissonpef/marketplace_smart_filter/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/alissonpef/marketplace_smart_filter.svg?style=for-the-badge
[forks-url]: https://github.com/alissonpef/marketplace_smart_filter/network/members
[stars-shield]: https://img.shields.io/github/stars/alissonpef/marketplace_smart_filter.svg?style=for-the-badge
[stars-url]: https://github.com/alissonpef/marketplace_smart_filter/stargazers
[issues-shield]: https://img.shields.io/github/issues/alissonpef/marketplace_smart_filter.svg?style=for-the-badge
[issues-url]: https://github.com/alissonpef/marketplace_smart_filter/issues
[license-shield]: https://img.shields.io/github/license/alissonpef/marketplace_smart_filter.svg?style=for-the-badge
[license-url]: https://github.com/alissonpef/marketplace_smart_filter/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/alisson-pereira-ferreira/
[JavaScript-shield]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JavaScript-url]: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript
[Chrome-shield]: https://img.shields.io/badge/Google_Chrome-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white
[Chrome-url]: https://developer.chrome.com/docs/extensions/
[NodeJS-shield]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[NodeJS-url]: https://nodejs.org/
[Prettier-shield]: https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black
[Prettier-url]: https://prettier.io/
