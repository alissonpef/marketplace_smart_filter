# Changelog

Todas as mudanças relevantes deste projeto são registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue o [Semantic Versioning](https://semver.org/lang/pt-BR/):
correção vira patch, funcionalidade nova vira minor, quebra de contrato vira major.

## [Unreleased]

### Added
- Documentação formal de arquitetura em `docs/architecture.md`.
- Catálogo de governança de personas de agentes em `docs/agents.md` e regras no `AGENTS.md`.
- Template de Architecture Decision Records em `docs/adr/0000-template.md`.

## [2.1.0] - 2026-10-10

### Added
- Motor de correspondência semântica e inteligente (`matcher.js`):
  - Normalização e equivalência automática de modelos (ex.: `g15`, `g 15` e `g-15`).
  - Suporte a sinônimos configuráveis e pré-carregados (notebook/laptop, celular/smartphone).
  - Tolerância a plurais e distância Levenshtein de até 1 caractere para pequenos erros de digitação.
  - Sintaxe de busca avançada: negação com prefixo `-` (ex.: `-moto`) e termos exatos com aspas (`"..."`).
  - Modos de correspondência: Estrito (todas as palavras) e Inteligente (modelo obrigatório + palavras flexíveis).
- Filtro inteligente de acessórios com lista expansível de termos (`capa`, `película`, `carregador`, `peças`).
- Detecção estatística de preço suspeito / anti-golpe (`price.js`):
  - Parser robusto de moeda em Real brasileiro (BRL).
  - Cálculo de mediana real de preços com quorum mínimo de 5 amostras válidas.
  - Alerta visual em anúncios com valor abaixo de 50% da mediana calculada.
- Controle de visitas e rastreamento de anúncios novos (`visits.js` e `history.js`):
  - Marcação de anúncios descobertos após a primeira visita da consulta.
  - Esmaecimento automático de anúncios já clicados e opção de ocultação com 1 clique.
  - Filtro "Apenas novos" para foco em oportunidades recentes.
- Subsistema assíncrono de leitura de descrições em segundo plano (`src/descriptions/`):
  - Fila educada com rate-limiting (`fetcher.js`) e detecção automática de bloqueio de login do Facebook.
  - Parser de conteúdo (`parser.js`) e cache com política LRU e tempo de expiração (`cache.js`).
  - Filtro semântico para desconsiderar anúncios com intenção de troca (ex.: "aceito na troca").
- Painel flutuante embutido via Shadow DOM (`panel.js` e `ui/panel.css`):
  - Isolamento estrito de estilos sem colisão com o CSS global do Facebook.
  - Alternador de ordenação visual por preço crescente/decrescente via CSS `order`.
  - Suporte sincronizado a Tema Claro e Tema Escuro (Light/Dark mode).
- Atalho de teclado global configurável `<kbd>Alt+Shift+F</kbd>` para alternar o filtro rapidamente.
- Suíte completa de testes automatizados com Node.js nativo (`node --test`) e simulações com JSDOM.
