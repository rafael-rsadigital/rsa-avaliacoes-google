/* Navegação modular: não substitui nem altera os fluxos atuais de avaliações/publicações. */
(() => {
  const wrap = document.querySelector(".wrap");
  const header = wrap?.querySelector(":scope > .top");
  const main = wrap?.querySelector(":scope > main");
  const footer = wrap?.querySelector(":scope > .foot");
  if (!wrap || !header || !main || wrap.dataset.navigationReady === "true") return;
  wrap.dataset.navigationReady = "true";

  const sidebar = document.createElement("aside");
  sidebar.className = "app-sidebar";
  sidebar.innerHTML = `
    <div class="app-sidebar-brand">
      <div class="app-sidebar-mark">RSA</div>
      <div><div class="app-sidebar-title">RSA DIGITAL</div><div class="app-sidebar-subtitle">Central Google</div></div>
    </div>
    <nav class="app-nav" aria-label="Menu principal">
      <div class="app-nav-label">Gestão</div>
      <button class="app-nav-link active" type="button" data-view="overview"><span class="app-nav-icon">⌂</span>Visão geral</button>
      <button class="app-nav-link" type="button" data-view="companies"><span class="app-nav-icon">▦</span>Empresas</button>
      <button class="app-nav-link" type="button" data-view="reviews"><span class="app-nav-icon">☆</span>Avaliações<span class="app-nav-meta">Ativo</span></button>
      <button class="app-nav-link" type="button" data-view="publications"><span class="app-nav-icon">▧</span>Publicações<span class="app-nav-meta">Ativo</span></button>
      <div class="app-nav-label">Inteligência</div>
      <button class="app-nav-link" type="button" data-view="reports"><span class="app-nav-icon">▥</span>Relatórios<span class="app-nav-meta">Em breve</span></button>
      <button class="app-nav-link" type="button" data-view="audit"><span class="app-nav-icon">✓</span>Auditoria e SEO<span class="app-nav-meta">Em breve</span></button>
      <div class="app-nav-label">Configuração</div>
      <button class="app-nav-link" type="button" data-view="create"><span class="app-nav-icon">＋</span>Criar empresa<span class="app-nav-meta">Em breve</span></button>
      <button class="app-nav-link" type="button" data-view="accounts"><span class="app-nav-icon">⚙</span>Contas Google<span class="app-nav-meta">Em breve</span></button>
    </nav>
    <div class="app-sidebar-foot">Ferramentas oficiais do Google<br>Ambiente RSA Digital</div>`;
  const content = document.createElement("div");
  content.className = "app-content";
  const menuToggle = document.createElement("button");
  menuToggle.className = "nav-menu-toggle";
  menuToggle.type = "button";
  menuToggle.setAttribute("aria-label", "Abrir menu");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.innerHTML = "☰";
  const backdrop = document.createElement("div");
  backdrop.className = "nav-menu-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  wrap.insertBefore(sidebar, header);
  document.body.appendChild(backdrop);
  wrap.appendChild(content);
  header.insertBefore(menuToggle, header.firstChild);

  function closeMenu() {
    sidebar.classList.remove("is-open");
    backdrop.classList.remove("is-visible");
    document.body.classList.remove("nav-menu-lock");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    menuToggle.innerHTML = "☰";
  }
  function openMenu() {
    sidebar.classList.add("is-open");
    backdrop.classList.add("is-visible");
    document.body.classList.add("nav-menu-lock");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
    menuToggle.innerHTML = "×";
  }
  menuToggle.addEventListener("click", () => sidebar.classList.contains("is-open") ? closeMenu() : openMenu());
  backdrop.addEventListener("click", closeMenu);
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
  [header, main, footer].filter(Boolean).forEach(node => content.appendChild(node));

  const title = main.querySelector("h1");
  const intro = main.querySelector(".intro");
  if (title) title.textContent = "Central de gestão Google";
  if (intro) intro.textContent = "Gerencie as fichas, avaliações e publicações das empresas conectadas à RSA Digital.";

  const panel = main.querySelector(".panel");
  const appBox = document.getElementById("appBox");
  const reviewsSection = document.getElementById("reviewsSection");
  const publicationsSection = document.getElementById("publicationsSection");
  const dashboard = document.createElement("section");
  dashboard.className = "nav-dashboard";
  dashboard.innerHTML = `
    <div class="nav-dashboard-grid">
      <article class="nav-dashboard-card"><h3>Empresas</h3><p id="navCompanySummary">Conecte uma conta Google para carregar as fichas disponíveis.</p><button class="btn secondary" type="button" data-go="companies">Ver empresas</button></article>
      <article class="nav-dashboard-card"><h3>Avaliações</h3><p>Consulte avaliações, identifique pendências e publique respostas com aprovação.</p><button class="btn secondary" type="button" data-go="reviews">Abrir avaliações</button></article>
      <article class="nav-dashboard-card"><h3>Publicações Google</h3><p>Envie fotos à galeria e publique ou programe atualizações com imagem.</p><button class="btn secondary" type="button" data-go="publications">Abrir publicações</button></article>
      <article class="nav-dashboard-card"><h3>Próximos módulos</h3><p>Relatórios de desempenho, auditoria da ficha e cadastro de novas empresas serão adicionados em etapas separadas.</p><button class="btn secondary" type="button" data-go="reports">Ver planejamento</button></article>
    </div>`;
  const placeholder = document.createElement("section");
  placeholder.className = "nav-placeholder nav-section-hidden";
  placeholder.setAttribute("aria-live", "polite");
  if (panel) {
    const tabs = panel.querySelector(".nav-tabs");
    if (tabs) tabs.classList.add("nav-section-hidden");
    panel.insertBefore(dashboard, appBox || panel.firstChild);
    panel.insertBefore(placeholder, appBox || panel.firstChild);
  }

  const descriptions = {
    companies: {
      kicker: "Cadastro e seleção",
      title: "Empresas conectadas",
      text: "A listagem de fichas continua disponível no seletor de empresa da área de trabalho. Nesta etapa, estamos preparando uma tela própria para organizar as empresas por conta Google, endereço e situação.",
      items: ["Visualizar fichas de todas as contas autorizadas", "Identificar a conta Google responsável por cada ficha", "Abrir avaliações, publicações e relatórios por empresa"]
    },
    reports: {
      kicker: "Módulo em desenvolvimento",
      title: "Relatórios de desempenho",
      text: "Este módulo reunirá os indicadores fornecidos pelas APIs oficiais do Google. A disponibilidade de cada métrica será validada antes de exibi-la, sem estimativas apresentadas como dados reais.",
      items: ["Visualizações e interações do perfil", "Cliques no site, ligações e rotas, quando disponíveis", "Comparativo entre períodos e histórico de publicações"]
    },
    audit: {
      kicker: "Módulo em desenvolvimento",
      title: "Auditoria e otimização",
      text: "A auditoria analisará os dados efetivamente retornados pelo Google e organizará recomendações de melhoria, sem alterar a ficha automaticamente.",
      items: ["Categorias, informações e serviços cadastrados", "Campos ausentes ou incompletos", "Sugestões de otimização e plano de ação"]
    },
    create: {
      kicker: "Módulo em desenvolvimento",
      title: "Criar uma nova empresa",
      text: "O cadastro será um fluxo separado da gestão das fichas existentes. A criação pela API não garante verificação nem publicação imediata no Google; esses estados serão apresentados separadamente.",
      items: ["Escolher a conta Google que será proprietária", "Preencher nome, categoria, endereço ou área de atendimento", "Criar a ficha e acompanhar as etapas posteriores de verificação"]
    },
    accounts: {
      kicker: "Módulo em desenvolvimento",
      title: "Contas Google",
      text: "A conexão de contas adicionais continua funcionando pelo fluxo seguro já existente. Esta tela futuramente facilitará a visualização das contas conectadas e das fichas associadas.",
      items: ["Listar contas autorizadas e seus rótulos", "Identificar fichas vinculadas a cada conta", "Orientar a reconexão quando uma autorização expirar"]
    }
  };

  function updateCompanySummary() {
    const summary = document.getElementById("navCompanySummary");
    if (!summary) return;
    const count = typeof locations !== "undefined" && Array.isArray(locations) ? locations.length : 0;
    summary.textContent = count
      ? count + " ficha(s) carregada(s) nesta sessão. Use o seletor de empresa para escolher a ficha."
      : "Conecte uma conta Google para carregar as fichas disponíveis.";
  }

  function setView(view) {
    sidebar.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    dashboard.classList.toggle("nav-section-hidden", view !== "overview");
    placeholder.classList.toggle("nav-section-hidden", !descriptions[view]);
    if (descriptions[view]) {
      const item = descriptions[view];
      placeholder.innerHTML = `<div class="nav-placeholder-card"><div class="nav-placeholder-kicker">${item.kicker}</div><h2>${item.title}</h2><p>${item.text}</p><ul class="nav-placeholder-list">${item.items.map(value => "<li>" + value + "</li>").join("")}</ul></div>`;
    }
    if (view === "reviews" || view === "publications") {
      if (reviewsSection) reviewsSection.classList.remove("nav-section-hidden");
      if (publicationsSection) publicationsSection.classList.remove("nav-section-hidden");
      dashboard.classList.add("nav-section-hidden");
      placeholder.classList.add("nav-section-hidden");
      if (typeof window.showMainSection === "function") window.showMainSection(view);
    } else {
      if (reviewsSection) reviewsSection.classList.add("nav-section-hidden");
      if (publicationsSection) publicationsSection.classList.add("nav-section-hidden");
    }
    updateCompanySummary();
  }

  sidebar.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    setView(button.dataset.view);
    if (window.matchMedia("(max-width: 900px)").matches) closeMenu();
  }));
  dashboard.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => {
    const target = button.dataset.go;
    const navButton = sidebar.querySelector('[data-view="' + target + '"]');
    if (navButton) navButton.click();
  }));

  const locationSelect = document.getElementById("locationSelect");
  if (locationSelect) locationSelect.addEventListener("change", updateCompanySummary);
  const connectButton = document.getElementById("connectBtn");
  if (connectButton) connectButton.addEventListener("click", () => setTimeout(updateCompanySummary, 700));
  setView("overview");
})();