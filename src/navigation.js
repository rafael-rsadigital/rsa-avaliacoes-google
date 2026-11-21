/* Navegação modular: não substitui nem altera os fluxos atuais de avaliações/publicações. */
(() => {
  const wrap = document.querySelector(".wrap");
  const header = wrap?.querySelector(":scope > .top");
  const main = wrap?.querySelector(":scope > main");
  const footer = wrap?.querySelector(":scope > .foot");
  if (!wrap || !header || !main || wrap.dataset.navigationReady === "true") return;
  wrap.dataset.navigationReady = "true";

  let adminAccessKey = "";

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
      kicker: "Acesso e autorizações",
      title: "Contas Google",
      text: "Consulte as contas autorizadas e as fichas acessíveis por cada uma. A consulta usa a chave administrativa no servidor; tokens de acesso e atualização nunca são enviados ao navegador.",
      items: ["Visualizar contas conectadas e seus rótulos", "Conferir quantas fichas cada conta consegue acessar", "Adicionar novas contas pelo fluxo OAuth seguro"]
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

  function formatAddress(address) {
    if (!address) return "Endereço não informado pelo Google";
    if (typeof address === "string") return address;
    return [
      ...(address.addressLines || []),
      address.locality,
      address.administrativeArea,
      address.postalCode
    ].filter(Boolean).join(", ") || "Endereço não informado pelo Google";
  }

  function renderCompanies() {
    if (!placeholder || !placeholder.classList.contains("nav-section-hidden") && !placeholder.querySelector(".companies-panel")) {
      // A tela é montada apenas quando a seção Empresas é aberta.
    }
    const data = typeof locations !== "undefined" && Array.isArray(locations) ? locations : [];
    placeholder.innerHTML = "";
    const section = document.createElement("div");
    section.className = "companies-panel";
    const heading = document.createElement("div");
    heading.className = "companies-heading";
    const copy = document.createElement("div");
    const kicker = document.createElement("div");
    kicker.className = "nav-placeholder-kicker";
    kicker.textContent = "Cadastro e seleção";
    const title = document.createElement("h2");
    title.textContent = "Empresas conectadas";
    const description = document.createElement("p");
    description.textContent = "Consulte as fichas retornadas pela conta Google conectada nesta sessão e escolha qual deseja gerenciar.";
    copy.append(kicker, title, description);
    const count = document.createElement("div");
    count.className = "companies-count";
    count.textContent = data.length + (data.length === 1 ? " empresa" : " empresas");
    heading.append(copy, count);
    section.append(heading);

    if (!data.length) {
      const empty = document.createElement("div");
      empty.className = "companies-empty";
      empty.textContent = "Nenhuma ficha carregada. Conecte uma conta Google para consultar as empresas às quais ela tem acesso.";
      section.append(empty);
      placeholder.append(section);
      return;
    }

    const controls = document.createElement("div");
    controls.className = "companies-controls";
    const search = document.createElement("input");
    search.type = "search";
    search.className = "companies-search";
    search.placeholder = "Buscar por nome, endereço ou site...";
    search.setAttribute("aria-label", "Buscar empresas");
    const scope = document.createElement("span");
    scope.className = "companies-scope";
    scope.textContent = "Conta Google desta sessão";
    controls.append(search, scope);
    section.append(controls);

    const list = document.createElement("div");
    list.className = "companies-list";
    section.append(list);

    function draw(query = "") {
      list.innerHTML = "";
      const term = query.trim().toLocaleLowerCase("pt-BR");
      const filtered = data.filter(loc => [
        loc.title, formatAddress(loc.address), loc.websiteUri
      ].join(" ").toLocaleLowerCase("pt-BR").includes(term));
      if (!filtered.length) {
        const empty = document.createElement("div");
        empty.className = "companies-empty";
        empty.textContent = "Nenhuma empresa corresponde à busca.";
        list.append(empty);
        return;
      }
      filtered.forEach(loc => {
        const originalIndex = data.indexOf(loc);
        const card = document.createElement("article");
        card.className = "company-card";
        const info = document.createElement("div");
        info.className = "company-info";
        const name = document.createElement("h3");
        name.textContent = loc.title || loc.name || "Empresa sem nome";
        const address = document.createElement("p");
        address.textContent = formatAddress(loc.address);
        info.append(name, address);
        if (loc.websiteUri) {
          const site = document.createElement("a");
          site.href = loc.websiteUri;
          site.target = "_blank";
          site.rel = "noopener noreferrer";
          site.textContent = loc.websiteUri.replace(/^https?:\/\//, "").replace(/\/$/, "");
          info.append(site);
        }
        const actions = document.createElement("div");
        actions.className = "company-actions";
        const selected = typeof selectedLocation !== "undefined" && selectedLocation?.name === loc.name;
        const status = document.createElement("span");
        status.className = "company-status" + (selected ? " is-selected" : "");
        status.textContent = selected ? "Selecionada" : "Disponível";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn " + (selected ? "secondary" : "primary");
        button.textContent = selected ? "Empresa atual" : "Gerenciar empresa";
        button.disabled = selected;
        button.addEventListener("click", () => {
          const selector = document.getElementById("locationSelect");
          if (!selector) return;
          selector.value = String(originalIndex);
          selector.dispatchEvent(new Event("change", { bubbles: true }));
          renderCompanies();
        });
        actions.append(status, button);
        card.append(info, actions);
        list.append(card);
      });
    }
    search.addEventListener("input", () => draw(search.value));
    draw();
    placeholder.append(section);
  }

  function renderAudit() {
    placeholder.innerHTML = "";
    const section = document.createElement("div");
    section.className = "audit-panel";
    const heading = document.createElement("div");
    heading.className = "companies-heading";
    const copy = document.createElement("div");
    const kicker = document.createElement("div");
    kicker.className = "nav-placeholder-kicker";
    kicker.textContent = "Diagnóstico da ficha";
    const title = document.createElement("h2");
    title.textContent = "Auditoria e SEO local";
    const description = document.createElement("p");
    description.textContent = "Analise informações cadastradas diretamente no Perfil da Empresa Google. O diagnóstico é consultivo e não altera os dados da ficha.";
    copy.append(kicker, title, description);
    heading.append(copy);
    section.append(heading);

    const form = document.createElement("div");
    form.className = "audit-controls";
    const accountSelect = document.createElement("select");
    accountSelect.className = "companies-search";
    accountSelect.setAttribute("aria-label", "Conta Google");
    accountSelect.innerHTML = '<option value="">Selecione uma conta Google</option>';
    const locationSelect = document.createElement("select");
    locationSelect.className = "companies-search";
    locationSelect.disabled = true;
    locationSelect.setAttribute("aria-label", "Empresa para auditoria");
    locationSelect.innerHTML = '<option value="">Selecione uma empresa</option>';
    const run = document.createElement("button");
    run.type = "button";
    run.className = "btn primary";
    run.textContent = "Analisar ficha";
    run.disabled = true;
    form.append(accountSelect, locationSelect, run);
    section.append(form);

    const status = document.createElement("div");
    status.className = "accounts-message";
    status.setAttribute("aria-live", "polite");
    section.append(status);
    const result = document.createElement("div");
    result.className = "audit-results";
    section.append(result);

    if (!adminAccessKey) {
      status.className = "accounts-message is-error";
      status.textContent = "Para usar a auditoria, primeiro abra Contas Google e consulte as contas com a chave de configuração. A autorização ficará disponível apenas durante esta sessão.";
      const goAccounts = document.createElement("button");
      goAccounts.type = "button";
      goAccounts.className = "btn secondary";
      goAccounts.textContent = "Abrir Contas Google";
      goAccounts.addEventListener("click", () => sidebar.querySelector('[data-view="accounts"]')?.click());
      section.append(goAccounts);
      placeholder.append(section);
      return;
    }

    let accounts = [];
    function populateLocations() {
      const account = accounts.find(item => item.id === accountSelect.value);
      locationSelect.innerHTML = '<option value="">Selecione uma empresa</option>';
      (account?.locations || []).forEach(location => {
        const option = document.createElement("option");
        option.value = location.locationId || "";
        option.textContent = location.title || location.name;
        locationSelect.append(option);
      });
      locationSelect.disabled = !account?.locations?.length;
      run.disabled = !locationSelect.value;
    }
    accountSelect.addEventListener("change", populateLocations);
    locationSelect.addEventListener("change", () => { run.disabled = !locationSelect.value; });

    function addCheck(container, label, value, detail) {
      const row = document.createElement("div");
      row.className = "audit-check " + (value ? "is-ok" : "is-missing");
      const mark = document.createElement("span");
      mark.className = "audit-check-mark";
      mark.textContent = value ? "✓" : "!";
      const body = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = label;
      const note = document.createElement("p");
      note.textContent = detail;
      body.append(name, note);
      row.append(mark, body);
      container.append(row);
      return Boolean(value);
    }

    function renderResult(location) {
      result.innerHTML = "";
      const categories = location.categories || {};
      const primaryCategory = categories.primaryCategory?.displayName || categories.primaryCategory?.name || "";
      const additionalCategories = categories.additionalCategories || [];
      const profileDescription = location.profile?.description || "";
      const phone = location.phoneNumbers?.primaryPhone || "";
      const address = location.storefrontAddress;
      const hasAddress = Boolean(address?.addressLines?.length || address?.locality);
      const hasServiceArea = Boolean(location.serviceArea);
      const hasHours = Boolean(location.regularHours?.periods?.length);
      const serviceItems = location.serviceItems || [];
      const checks = [
        ["Categoria principal", Boolean(primaryCategory), primaryCategory || "Cadastre uma categoria principal adequada à atividade."],
        ["Descrição da empresa", Boolean(profileDescription.trim()), profileDescription.trim() || "Inclua uma descrição objetiva dos serviços, diferenciais e área atendida."],
        ["Telefone", Boolean(phone), phone || "Adicione um telefone direto para contato."],
        ["Site", Boolean(location.websiteUri), location.websiteUri || "Informe o site oficial, se a empresa possuir."],
        ["Localização ou área atendida", hasAddress || hasServiceArea, hasAddress ? formatAddress(address) : hasServiceArea ? "Área de atendimento cadastrada." : "Informe o endereço da loja ou a área de atendimento, conforme o modelo de negócio."],
        ["Horários", hasHours, hasHours ? location.regularHours.periods.length + " período(s) de funcionamento cadastrado(s)." : "Cadastre os horários de funcionamento ou atendimento."],
        ["Serviços", serviceItems.length > 0, serviceItems.length ? serviceItems.length + " serviço(s) cadastrado(s)." : "Se a empresa presta serviços, cadastre os principais serviços oferecidos."]
      ];
      const score = checks.filter(item => item[1]).length;
      const summary = document.createElement("div");
      summary.className = "audit-score";
      const scoreValue = document.createElement("strong");
      scoreValue.textContent = score + "/" + checks.length;
      const scoreLabel = document.createElement("span");
      scoreLabel.textContent = "itens verificados preenchidos";
      summary.append(scoreValue, scoreLabel);
      const company = document.createElement("h3");
      company.className = "audit-company-title";
      company.textContent = location.title || "Ficha selecionada";
      const categoryMeta = document.createElement("p");
      categoryMeta.className = "audit-meta";
      categoryMeta.textContent = "Categoria: " + (primaryCategory || "Não informada") +
        (additionalCategories.length ? " · " + additionalCategories.length + " categoria(s) adicional(is)" : "");
      result.append(summary, company, categoryMeta);
      const list = document.createElement("div");
      list.className = "audit-checks";
      checks.forEach(item => addCheck(list, item[0], item[1], item[2]));
      result.append(list);
      const foot = document.createElement("p");
      foot.className = "audit-disclaimer";
      foot.textContent = "Este indicador mede apenas a presença dos campos consultados. Não representa uma nota do Google nem garante posicionamento nos resultados de busca.";
      result.append(foot);
    }

    async function loadAccounts() {
      status.textContent = "Carregando contas e fichas…";
      try {
        const response = await fetch("/api/google/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: adminAccessKey })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Não foi possível carregar as contas.");
        accounts = data.accounts || [];
        accounts.filter(item => item.status === "connected").forEach(account => {
          const option = document.createElement("option");
          option.value = account.id;
          option.textContent = account.label + " (" + account.locationCount + " fichas)";
          accountSelect.append(option);
        });
        status.className = "accounts-message is-success";
        status.textContent = accounts.length ? "Escolha a conta e a ficha que deseja analisar." : "Nenhuma conta Google conectada.";
      } catch (error) {
        status.className = "accounts-message is-error";
        status.textContent = error.message;
      }
    }

    run.addEventListener("click", async () => {
      if (!accountSelect.value || !locationSelect.value) return;
      run.disabled = true;
      run.textContent = "Analisando…";
      status.className = "accounts-message";
      status.textContent = "Consultando os campos da ficha no Google…";
      result.innerHTML = "";
      try {
        const response = await fetch("/api/google/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: adminAccessKey, accountKey: accountSelect.value, locationId: locationSelect.value })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Não foi possível analisar a ficha.");
        renderResult(data.location || {});
        status.className = "accounts-message is-success";
        status.textContent = "Auditoria concluída com os dados retornados pelo Google.";
      } catch (error) {
        status.className = "accounts-message is-error";
        status.textContent = error.message;
      } finally {
        run.disabled = !locationSelect.value;
        run.textContent = "Analisar ficha";
      }
    });
    placeholder.append(section);
    loadAccounts();
  }

  function renderAccounts() {
    placeholder.innerHTML = "";
    const section = document.createElement("div");
    section.className = "accounts-panel";
    const heading = document.createElement("div");
    heading.className = "companies-heading";
    const copy = document.createElement("div");
    const kicker = document.createElement("div");
    kicker.className = "nav-placeholder-kicker";
    kicker.textContent = "Acesso e autorizações";
    const title = document.createElement("h2");
    title.textContent = "Contas Google conectadas";
    const description = document.createElement("p");
    description.textContent = "A chave de configuração autoriza esta consulta administrativa. Ela é enviada somente ao servidor e não fica salva no navegador.";
    copy.append(kicker, title, description);
    heading.append(copy);
    section.append(heading);

    const form = document.createElement("div");
    form.className = "accounts-access";
    const key = document.createElement("input");
    key.type = "password";
    key.autocomplete = "current-password";
    key.placeholder = "Chave de configuração (GOOGLE_CONNECT_SECRET)";
    key.setAttribute("aria-label", "Chave de configuração Google");
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "btn primary";
    refresh.textContent = "Consultar contas";
    form.append(key, refresh);
    section.append(form);

    const message = document.createElement("div");
    message.className = "accounts-message";
    message.setAttribute("aria-live", "polite");
    section.append(message);

    const actions = document.createElement("div");
    actions.className = "accounts-footer";
    const add = document.createElement("a");
    add.className = "btn secondary";
    add.href = "/api/google/connect";
    add.target = "_blank";
    add.rel = "noopener noreferrer";
    add.textContent = "Adicionar outra conta Google";
    const note = document.createElement("span");
    note.textContent = "A autorização abre em uma nova aba.";
    actions.append(add, note);
    section.append(actions);

    const list = document.createElement("div");
    list.className = "accounts-list";
    section.append(list);
    let busy = false;

    async function load() {
      const secret = key.value.trim();
      if (!secret) {
        message.className = "accounts-message is-error";
        message.textContent = "Informe a chave de configuração para consultar as contas.";
        key.focus();
        return;
      }
      if (busy) return;
      busy = true;
      refresh.disabled = true;
      refresh.textContent = "Consultando…";
      message.className = "accounts-message";
      message.textContent = "Consultando as autorizações e fichas no Google…";
      list.innerHTML = "";
      try {
        const response = await fetch("/api/google/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: secret })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Não foi possível consultar as contas.");
        adminAccessKey = secret;
        const accounts = data.accounts || [];
        message.className = "accounts-message is-success";
        message.textContent = accounts.length
          ? accounts.length + (accounts.length === 1 ? " conta autorizada encontrada." : " contas autorizadas encontradas.")
          : "Nenhuma conta adicional cadastrada. Conecte a conta principal ou adicione outra.";
        if (!accounts.length) {
          const empty = document.createElement("div");
          empty.className = "companies-empty";
          empty.textContent = "Nenhuma autorização encontrada no armazenamento seguro.";
          list.append(empty);
        }
        accounts.forEach(account => {
          const card = document.createElement("article");
          card.className = "account-card";
          const info = document.createElement("div");
          info.className = "company-info";
          const name = document.createElement("h3");
          name.textContent = account.label || "Conta Google";
          const meta = document.createElement("p");
          const date = account.createdAt ? new Date(account.createdAt).toLocaleDateString("pt-BR") : "Data não disponível";
          meta.textContent = "Conectada em " + date + " · " + account.locationCount + (account.locationCount === 1 ? " ficha" : " fichas");
          info.append(name, meta);
          const status = document.createElement("span");
          status.className = "account-status " + (account.status === "connected" ? "is-connected" : "is-error");
          status.textContent = account.status === "connected" ? "Autorização ativa" : "Falha na consulta";
          card.append(info, status);
          if (account.status === "error") {
            const error = document.createElement("p");
            error.className = "account-error";
            error.textContent = account.message || "Verifique a autorização desta conta.";
            card.append(error);
          } else if (account.locations?.length) {
            const details = document.createElement("details");
            details.className = "account-locations";
            const summary = document.createElement("summary");
            summary.textContent = "Ver fichas desta conta (" + account.locations.length + ")";
            details.append(summary);
            const locationList = document.createElement("ul");
            account.locations.forEach(location => {
              const item = document.createElement("li");
              const business = document.createElement("strong");
              business.textContent = location.title || "Empresa sem nome";
              const address = document.createElement("span");
              address.textContent = formatAddress(location.address);
              item.append(business, address);
              locationList.append(item);
            });
            details.append(locationList);
            card.append(details);
          }
          list.append(card);
        });
      } catch (error) {
        message.className = "accounts-message is-error";
        message.textContent = error.message || "Falha ao consultar as contas.";
      } finally {
        busy = false;
        refresh.disabled = false;
        refresh.textContent = "Consultar contas";
      }
    }
    refresh.addEventListener("click", load);
    key.addEventListener("keydown", event => { if (event.key === "Enter") load(); });
    placeholder.append(section);
  }

  const refreshReviewsButton = document.getElementById("refreshBtn");

  function setView(view) {
    if (refreshReviewsButton) refreshReviewsButton.classList.toggle("hidden", view !== "reviews");
    sidebar.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    dashboard.classList.toggle("nav-section-hidden", view !== "overview");
    placeholder.classList.toggle("nav-section-hidden", !descriptions[view]);
    if (descriptions[view]) {
      const item = descriptions[view];
      placeholder.innerHTML = `<div class="nav-placeholder-card"><div class="nav-placeholder-kicker">${item.kicker}</div><h2>${item.title}</h2><p>${item.text}</p><ul class="nav-placeholder-list">${item.items.map(value => "<li>" + value + "</li>").join("")}</ul></div>`;
    }
    if (view === "companies") renderCompanies();
    if (view === "accounts") renderAccounts();
    if (view === "audit") renderAudit();
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
  if (locationSelect) locationSelect.addEventListener("change", () => {
    updateCompanySummary();
    if (sidebar.querySelector('[data-view="companies"]')?.classList.contains("active")) renderCompanies();
  });
  window.addEventListener("rsa:locations-updated", () => {
    updateCompanySummary();
    if (sidebar.querySelector('[data-view="companies"]')?.classList.contains("active")) renderCompanies();
  });
  const connectButton = document.getElementById("connectBtn");
  if (connectButton) connectButton.addEventListener("click", () => setTimeout(updateCompanySummary, 700));
  setView("overview");
})();