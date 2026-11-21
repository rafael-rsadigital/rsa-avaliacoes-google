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
      <button class="app-nav-link" type="button" data-view="reports"><span class="app-nav-icon">▥</span>Relatórios</button>
      <button class="app-nav-link" type="button" data-view="audit"><span class="app-nav-icon">✓</span>Auditoria e SEO</button>
      <div class="app-nav-label">Configuração</div>
      <button class="app-nav-link" type="button" data-view="create"><span class="app-nav-icon">＋</span>Criar empresa</button>
      <button class="app-nav-link" type="button" data-view="accounts"><span class="app-nav-icon">⚙</span>Contas Google</button>
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
      <article class="nav-dashboard-card"><h3>Ferramentas de gestão</h3><p>Organize as contas Google, acompanhe o desempenho e analise a qualidade das fichas em um só lugar.</p><button class="btn secondary" type="button" data-go="accounts">Gerenciar contas</button></article>
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
    description.textContent = "Consulte as fichas de todas as contas Google autorizadas e escolha qual deseja gerenciar.";
    copy.append(kicker, title, description);
    const count = document.createElement("div");
    count.className = "companies-count";
    count.textContent = "Carregando…";
    heading.append(copy, count);
    section.append(heading);
    const message = document.createElement("div");
    message.className = "accounts-message";
    message.setAttribute("aria-live", "polite");
    section.append(message);
    const controls = document.createElement("div");
    controls.className = "companies-controls";
    const search = document.createElement("input");
    search.type = "search";
    search.className = "companies-search";
    search.placeholder = "Buscar por nome, endereço, site ou conta...";
    search.setAttribute("aria-label", "Buscar empresas");
    const scope = document.createElement("span");
    scope.className = "companies-scope";
    scope.textContent = "Todas as contas Google conectadas";
    controls.append(search, scope);
    section.append(controls);
    const list = document.createElement("div");
    list.className = "companies-list";
    section.append(list);
    placeholder.append(section);

    if (!adminAccessKey) {
      count.textContent = "—";
      message.className = "accounts-message is-error";
      message.textContent = "Para reunir as fichas de todas as contas, primeiro consulte as autorizações na aba Contas Google.";
      const go = document.createElement("button");
      go.type = "button";
      go.className = "btn secondary";
      go.textContent = "Abrir Contas Google";
      go.addEventListener("click", () => sidebar.querySelector('[data-view="accounts"]')?.click());
      section.append(go);
      return;
    }

    let data = [];
    function draw(query = "") {
      list.innerHTML = "";
      const term = query.trim().toLocaleLowerCase("pt-BR");
      const filtered = data.filter(loc => [
        loc.title, formatAddress(loc.address), loc.websiteUri, loc.accountLabel, loc.accountName
      ].join(" ").toLocaleLowerCase("pt-BR").includes(term));
      if (!filtered.length) {
        const empty = document.createElement("div");
        empty.className = "companies-empty";
        empty.textContent = data.length ? "Nenhuma empresa corresponde à busca." : "Nenhuma ficha encontrada nas contas consultadas.";
        list.append(empty);
        return;
      }
      filtered.forEach(loc => {
        const card = document.createElement("article");
        card.className = "company-card";
        const info = document.createElement("div");
        info.className = "company-info";
        const name = document.createElement("h3");
        name.textContent = loc.title || loc.name || "Empresa sem nome";
        const address = document.createElement("p");
        address.textContent = formatAddress(loc.address);
        const account = document.createElement("p");
        account.className = "company-account-label";
        account.textContent = "Conta: " + (loc.accountLabel || "Conta Google");
        info.append(name, address, account);
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
          selector.value = String(data.indexOf(loc));
          selector.dispatchEvent(new Event("change", { bubbles: true }));
          sidebar.querySelector('[data-view="reviews"]')?.click();
        });
        actions.append(status, button);
        card.append(info, actions);
        list.append(card);
      });
    }
    search.addEventListener("input", () => draw(search.value));

    (async () => {
      try {
        message.textContent = "Consultando as fichas de todas as contas…";
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accounts", key: adminAccessKey })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Não foi possível carregar as empresas.");
        (result.accounts || []).forEach(account => {
          if (account.status !== "connected") return;
          (account.locations || []).forEach(location => data.push({
            ...location,
            accountKey: account.id,
            accountLabel: account.label || "Conta Google"
          }));
        });
        count.textContent = data.length + (data.length === 1 ? " empresa" : " empresas");
        message.className = "accounts-message is-success";
        message.textContent = "Fichas reunidas a partir de " + (result.accounts || []).filter(item => item.status === "connected").length + " conta(s) Google autorizada(s).";
        window.rsaAdminAccessKey = adminAccessKey;
        window.dispatchEvent(new CustomEvent("rsa:all-locations-loaded", { detail: { locations: data } }));
        draw();
      } catch (error) {
        count.textContent = "—";
        message.className = "accounts-message is-error";
        message.textContent = error.message;
      }
    })();
  }

  function renderCreateCompany() {
    placeholder.innerHTML = "";
    const section = document.createElement("div");
    section.className = "create-company-panel";
    const heading = document.createElement("div");
    heading.className = "companies-heading";
    const copy = document.createElement("div");
    const kicker = document.createElement("div");
    kicker.className = "nav-placeholder-kicker";
    kicker.textContent = "Novo Perfil da Empresa";
    const title = document.createElement("h2");
    title.textContent = "Criar empresa no Google";
    const introDescription = document.createElement("p");
    introDescription.textContent = "Preencha os dados, escolha uma categoria oficial e valide as informações antes de enviar a criação ao Google.";
    copy.append(kicker, title, introDescription);
    heading.append(copy);
    section.append(heading);

    const warning = document.createElement("p");
    warning.className = "create-company-warning";
    warning.textContent = "A criação não garante publicação imediata. O Google pode exigir uma etapa de verificação para liberar a ficha na Pesquisa e no Maps. Esta versão cadastra empresas com endereço físico.";
    section.append(warning);

    const form = document.createElement("div");
    form.className = "create-company-form";
    function field(labelText, type, placeholderText, required = false, maxLength = 250) {
      const wrap = document.createElement("label");
      wrap.className = "create-field";
      const label = document.createElement("span");
      label.textContent = labelText + (required ? " *" : "");
      const input = document.createElement("input");
      input.type = type;
      input.placeholder = placeholderText || "";
      input.maxLength = maxLength;
      input.required = required;
      wrap.append(label, input);
      form.append(wrap);
      return input;
    }
    const account = document.createElement("select");
    account.className = "companies-search";
    account.innerHTML = '<option value="">Selecione a conta Google proprietária</option>';
    const accountWrap = document.createElement("label");
    accountWrap.className = "create-field create-field-wide";
    const accountLabel = document.createElement("span");
    accountLabel.textContent = "Conta Google *";
    accountWrap.append(accountLabel, account);
    form.append(accountWrap);
    const name = field("Nome da empresa", "text", "Nome que será exibido no Google", true, 100);
    const street = field("Endereço / rua e número", "text", "Rua, avenida e número", true, 200);
    const city = field("Cidade", "text", "Cidade", true, 100);
    const state = field("Estado (UF)", "text", "Ex.: SP", true, 80);
    const postal = field("CEP", "text", "00000-000", true, 20);
    const phone = field("Telefone", "tel", "(00) 00000-0000", false, 40);
    const website = field("Site (HTTPS)", "url", "https://www.empresa.com.br", false, 300);
    const businessDescription = document.createElement("textarea");
    businessDescription.maxLength = 750;
    businessDescription.placeholder = "Descrição objetiva da empresa (até 750 caracteres)";
    const descriptionWrap = document.createElement("label");
    descriptionWrap.className = "create-field create-field-wide";
    const descriptionLabel = document.createElement("span");
    descriptionLabel.textContent = "Descrição da empresa";
    descriptionWrap.append(descriptionLabel, businessDescription);
    form.append(descriptionWrap);

    const categoryRow = document.createElement("div");
    categoryRow.className = "create-category-row";
    const categorySearch = document.createElement("input");
    categorySearch.className = "companies-search";
    categorySearch.placeholder = "Buscar categoria (ex.: oficina mecânica)";
    categorySearch.setAttribute("aria-label", "Buscar categoria oficial do Google");
    categorySearch.maxLength = 80;
    const searchCategory = document.createElement("button");
    searchCategory.type = "button";
    searchCategory.className = "btn secondary";
    searchCategory.textContent = "Buscar categoria";
    categoryRow.append(categorySearch, searchCategory);
    const categoryWrap = document.createElement("div");
    categoryWrap.className = "create-field create-field-wide";
    const categoryLabel = document.createElement("span");
    categoryLabel.textContent = "Categoria principal *";
    const categorySelect = document.createElement("select");
    categorySelect.className = "companies-search";
    categorySelect.innerHTML = '<option value="">Busque e selecione uma categoria oficial</option>';
    categoryWrap.append(categoryLabel, categoryRow, categorySelect);
    form.append(categoryWrap);

    const actions = document.createElement("div");
    actions.className = "create-actions";
    const validate = document.createElement("button");
    validate.type = "button";
    validate.className = "btn primary";
    validate.textContent = "Validar dados";
    const create = document.createElement("button");
    create.type = "button";
    create.className = "btn primary";
    create.textContent = "Criar ficha no Google";
    create.hidden = true;
    actions.append(validate, create);
    form.append(actions);

    const status = document.createElement("div");
    status.className = "accounts-message";
    status.setAttribute("aria-live", "polite");
    const result = document.createElement("div");
    result.className = "create-company-result";
    section.append(form, status, result);
    let accounts = [];
    let validatedPayload = null;
    let busy = false;

    if (!adminAccessKey) {
      status.className = "accounts-message is-error";
      status.textContent = "Primeiro abra Contas Google e consulte as contas usando a chave de configuração.";
      const go = document.createElement("button");
      go.type = "button";
      go.className = "btn secondary";
      go.textContent = "Abrir Contas Google";
      go.addEventListener("click", () => sidebar.querySelector('[data-view="accounts"]')?.click());
      section.insertBefore(go, form);
      form.hidden = true;
      placeholder.append(section);
      return;
    }

    async function loadAccounts() {
      status.textContent = "Carregando contas comerciais disponíveis…";
      try {
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accounts", key: adminAccessKey })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Não foi possível carregar as contas.");
        accounts = data.accounts || [];
        accounts.forEach(item => {
          if (item.status !== "connected") return;
          (item.googleAccounts || []).forEach(parent => {
            const option = document.createElement("option");
            option.value = JSON.stringify({ accountKey: item.id, parentAccountName: parent.name });
            option.textContent = (item.label || "Conta Google") + " — " + (parent.accountName || parent.name);
            account.append(option);
          });
        });
        status.className = "accounts-message is-success";
        status.textContent = account.options.length > 1
          ? "Selecione a conta comercial na qual a nova ficha será criada."
          : "Nenhuma conta comercial disponível para criação.";
      } catch (error) {
        status.className = "accounts-message is-error";
        status.textContent = error.message;
      }
    }

    searchCategory.addEventListener("click", async () => {
      const selectedAccount = account.value;
      const query = categorySearch.value.trim();
      if (!selectedAccount || query.length < 2) {
        status.className = "accounts-message is-error";
        status.textContent = "Selecione a conta e informe pelo menos duas letras para buscar a categoria.";
        return;
      }
      const selected = JSON.parse(selectedAccount);
      searchCategory.disabled = true;
      searchCategory.textContent = "Buscando…";
      try {
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "categories", key: adminAccessKey, accountKey: selected.accountKey, query })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Não foi possível buscar categorias.");
        categorySelect.innerHTML = '<option value="">Selecione a categoria correta</option>';
        (data.categories || []).forEach(category => {
          const option = document.createElement("option");
          option.value = category.name;
          option.textContent = category.displayName;
          categorySelect.append(option);
        });
        status.className = data.categories?.length ? "accounts-message is-success" : "accounts-message is-error";
        status.textContent = data.categories?.length
          ? data.categories.length + " categoria(s) encontrada(s). Escolha a que melhor representa a atividade principal."
          : "Nenhuma categoria encontrada. Tente outro termo; a busca do Google considera o início do nome.";
      } catch (error) {
        status.className = "accounts-message is-error";
        status.textContent = error.message;
      } finally {
        searchCategory.disabled = false;
        searchCategory.textContent = "Buscar categoria";
      }
    });

    function collectPayload() {
      let selected;
      try { selected = JSON.parse(account.value); } catch {}
      return {
        key: adminAccessKey,
        accountKey: selected?.accountKey || "",
        parentAccountName: selected?.parentAccountName || "",
        title: name.value.trim(),
        categoryName: categorySelect.value,
        street: street.value.trim(),
        city: city.value.trim(),
        state: state.value.trim(),
        postalCode: postal.value.trim(),
        phone: phone.value.trim(),
        website: website.value.trim(),
        description: businessDescription.value.trim()
      };
    }

    validate.addEventListener("click", async () => {
      const payload = collectPayload();
      if (!payload.accountKey || !payload.title || !payload.categoryName || !payload.street || !payload.city || !payload.state || !payload.postalCode) {
        status.className = "accounts-message is-error";
        status.textContent = "Preencha os campos obrigatórios e selecione uma categoria oficial do Google.";
        return;
      }
      if (busy) return;
      busy = true;
      validate.disabled = true;
      validate.textContent = "Validando…";
      create.hidden = true;
      result.innerHTML = "";
      try {
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, action: "create-location", mode: "validate" })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "O Google não aceitou a validação.");
        validatedPayload = { ...payload, requestId: data.requestId };
        status.className = "accounts-message is-success";
        status.textContent = data.message || "Dados validados.";
        create.hidden = false;
        const preview = document.createElement("div");
        preview.className = "create-preview";
        preview.textContent = payload.title + " · " + categorySelect.selectedOptions[0].textContent + " · " + [payload.street, payload.city, payload.state, payload.postalCode].filter(Boolean).join(", ");
        result.append(preview);
      } catch (error) {
        validatedPayload = null;
        status.className = "accounts-message is-error";
        status.textContent = error.message;
      } finally {
        busy = false;
        validate.disabled = false;
        validate.textContent = "Validar dados";
      }
    });

    create.addEventListener("click", async () => {
      if (!validatedPayload || busy) return;
      if (!confirm("Confirma a criação da ficha “" + validatedPayload.title + "” na conta Google selecionada? Esta ação enviará o cadastro ao Google.")) return;
      busy = true;
      create.disabled = true;
      create.textContent = "Enviando…";
      try {
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...validatedPayload, action: "create-location", mode: "create" })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Não foi possível criar a ficha.");
        status.className = "accounts-message is-success";
        status.textContent = data.message || "Ficha criada.";
        result.innerHTML = "";
        const created = document.createElement("div");
        created.className = "create-preview";
        created.textContent = (data.location?.title || validatedPayload.title) + " · " + (data.location?.name || "Cadastro recebido pelo Google");
        result.append(created);
        create.hidden = true;
        validate.textContent = "Validar outra ficha";
        validatedPayload = null;
      } catch (error) {
        status.className = "accounts-message is-error";
        status.textContent = error.message;
      } finally {
        busy = false;
        create.disabled = false;
        create.textContent = "Criar ficha no Google";
      }
    });

    placeholder.append(section);
    loadAccounts();
  }

  function renderReports() {
    placeholder.innerHTML = "";
    const section = document.createElement("div");
    section.className = "reports-panel";
    const heading = document.createElement("div");
    heading.className = "companies-heading";
    const copy = document.createElement("div");
    const kicker = document.createElement("div");
    kicker.className = "nav-placeholder-kicker";
    kicker.textContent = "Desempenho do Perfil da Empresa";
    const title = document.createElement("h2");
    title.textContent = "Relatórios Google";
    const description = document.createElement("p");
    description.textContent = "Consulte métricas oficiais de visualizações e interações. Os resultados dependem da disponibilidade da Performance API e da cota liberada para o projeto Google.";
    copy.append(kicker, title, description);
    heading.append(copy);
    section.append(heading);

    const controls = document.createElement("div");
    controls.className = "reports-controls";
    const accountSelect = document.createElement("select");
    accountSelect.className = "companies-search";
    accountSelect.innerHTML = '<option value="">Selecione uma conta Google</option>';
    const locationSelect = document.createElement("select");
    locationSelect.className = "companies-search";
    locationSelect.disabled = true;
    locationSelect.innerHTML = '<option value="">Selecione uma empresa</option>';
    const start = document.createElement("input");
    start.type = "date";
    start.className = "reports-date";
    start.setAttribute("aria-label", "Data inicial");
    const end = document.createElement("input");
    end.type = "date";
    end.className = "reports-date";
    end.setAttribute("aria-label", "Data final");
    const run = document.createElement("button");
    run.type = "button";
    run.className = "btn primary";
    run.textContent = "Consultar relatório";
    run.disabled = true;
    const now = new Date();
    const toIso = date => [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
    const initialEnd = toIso(now);
    const initialStartDate = new Date(now);
    initialStartDate.setDate(initialStartDate.getDate()-29);
    start.value = toIso(initialStartDate);
    end.value = initialEnd;
    end.max = initialEnd;
    start.max = initialEnd;
    controls.append(accountSelect, locationSelect, start, end, run);
    section.append(controls);

    const presets = document.createElement("div");
    presets.className = "reports-presets";
    [30, 90].forEach(days => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn secondary";
      button.textContent = "Últimos " + days + " dias";
      button.addEventListener("click", () => {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate()-(days-1));
        start.value = toIso(startDate);
        end.value = toIso(endDate);
      });
      presets.append(button);
    });
    section.append(presets);

    const status = document.createElement("div");
    status.className = "accounts-message";
    status.setAttribute("aria-live", "polite");
    section.append(status);
    const results = document.createElement("div");
    results.className = "reports-results";
    section.append(results);

    if (!adminAccessKey) {
      status.className = "accounts-message is-error";
      status.textContent = "Primeiro consulte suas contas na aba Contas Google usando a chave de configuração.";
      const go = document.createElement("button");
      go.type = "button";
      go.className = "btn secondary";
      go.textContent = "Abrir Contas Google";
      go.addEventListener("click", () => sidebar.querySelector('[data-view="accounts"]')?.click());
      section.append(go);
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

    async function loadAccounts() {
      status.textContent = "Carregando contas e fichas…";
      try {
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accounts", key: adminAccessKey })
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
        status.textContent = "Selecione uma conta, uma ficha e o período do relatório.";
      } catch (error) {
        status.className = "accounts-message is-error";
        status.textContent = error.message;
      }
    }

    const metricLabels = {
      BUSINESS_IMPRESSIONS_DESKTOP_MAPS: "Visualizações no Maps (computador)",
      BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: "Visualizações na Pesquisa (computador)",
      BUSINESS_IMPRESSIONS_MOBILE_MAPS: "Visualizações no Maps (celular)",
      BUSINESS_IMPRESSIONS_MOBILE_SEARCH: "Visualizações na Pesquisa (celular)",
      WEBSITE_CLICKS: "Cliques no site",
      CALL_CLICKS: "Cliques para ligar",
      BUSINESS_DIRECTION_REQUESTS: "Solicitações de rota"
    };
    const total = values => values.reduce((sum, item) => sum + Number(item.value || 0), 0);
    function metricCard(label, value) {
      const card = document.createElement("article");
      card.className = "report-metric";
      const number = document.createElement("strong");
      number.textContent = Number(value).toLocaleString("pt-BR");
      const caption = document.createElement("span");
      caption.textContent = label;
      card.append(number, caption);
      return card;
    }

    run.addEventListener("click", async () => {
      if (!accountSelect.value || !locationSelect.value) return;
      if (!start.value || !end.value || start.value > end.value) {
        status.className = "accounts-message is-error";
        status.textContent = "Informe um período válido, com a data inicial anterior à final.";
        return;
      }
      run.disabled = true;
      run.textContent = "Consultando…";
      status.className = "accounts-message";
      status.textContent = "Buscando métricas oficiais no Google…";
      results.innerHTML = "";
      try {
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "performance",
            key: adminAccessKey,
            accountKey: accountSelect.value,
            locationId: locationSelect.value,
            startDate: start.value,
            endDate: end.value
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Não foi possível consultar o relatório.");
        const metrics = data.metrics || [];
        const available = metrics.filter(metric => !metric.error);
        const failed = metrics.filter(metric => metric.error);
        if (!available.length) {
          throw new Error(failed[0]?.error || "A Performance API não retornou métricas. Verifique se ela está habilitada e se o projeto possui cota.");
        }
        const byName = Object.fromEntries(metrics.map(metric => [metric.metric, metric]));
        const impressionsNames = [
          "BUSINESS_IMPRESSIONS_DESKTOP_MAPS", "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
          "BUSINESS_IMPRESSIONS_MOBILE_MAPS", "BUSINESS_IMPRESSIONS_MOBILE_SEARCH"
        ];
        const impressions = impressionsNames.reduce((sum, name) => sum + total(byName[name]?.values || []), 0);
        const website = total(byName.WEBSITE_CLICKS?.values || []);
        const calls = total(byName.CALL_CLICKS?.values || []);
        const directions = total(byName.BUSINESS_DIRECTION_REQUESTS?.values || []);
        const cards = document.createElement("div");
        cards.className = "reports-metrics-grid";
        cards.append(
          metricCard("Visualizações (Pesquisa + Maps)", impressions),
          metricCard("Cliques no site", website),
          metricCard("Cliques para ligar", calls),
          metricCard("Solicitações de rota", directions)
        );
        results.append(cards);

        const daily = new Map();
        impressionsNames.forEach(name => (byName[name]?.values || []).forEach(item => {
          daily.set(item.date, (daily.get(item.date) || 0) + Number(item.value || 0));
        }));
        const series = [...daily.entries()].sort((a,b) => a[0].localeCompare(b[0]));
        if (series.length) {
          const chartTitle = document.createElement("h3");
          chartTitle.className = "reports-chart-title";
          chartTitle.textContent = "Visualizações diárias";
          results.append(chartTitle);
          const chart = document.createElement("div");
          chart.className = "reports-bars";
          const max = Math.max(1, ...series.map(item => item[1]));
          series.forEach(([date, value]) => {
            const column = document.createElement("div");
            column.className = "reports-bar-column";
            const bar = document.createElement("div");
            bar.className = "reports-bar";
            bar.style.height = Math.max(3, value/max*100) + "%";
            bar.title = new Date(date + "T12:00:00").toLocaleDateString("pt-BR") + ": " + value.toLocaleString("pt-BR");
            const label = document.createElement("span");
            label.textContent = date.slice(8,10);
            column.append(bar, label);
            chart.append(column);
          });
          results.append(chart);
        }
        const detail = document.createElement("details");
        detail.className = "reports-details";
        const summary = document.createElement("summary");
        summary.textContent = "Ver métricas individuais";
        detail.append(summary);
        const list = document.createElement("ul");
        metrics.forEach(metric => {
          const item = document.createElement("li");
          const name = document.createElement("span");
          name.textContent = metricLabels[metric.metric] || metric.metric;
          const value = document.createElement("strong");
          value.textContent = metric.error ? "Indisponível" : total(metric.values).toLocaleString("pt-BR");
          item.append(name, value);
          if (metric.error) item.title = metric.error;
          list.append(item);
        });
        detail.append(list);
        results.append(detail);
        status.className = failed.length ? "accounts-message" : "accounts-message is-success";
        status.textContent = failed.length
          ? "Relatório parcial: " + available.length + " de " + metrics.length + " métricas disponíveis. Métricas indisponíveis podem exigir habilitação ou cota da API."
          : "Relatório concluído. Dados retornados pela API oficial do Google.";
      } catch (error) {
        status.className = "accounts-message is-error";
        status.textContent = error.message + " A Performance API pode exigir habilitação no Google Cloud e liberação de cota.";
      } finally {
        run.disabled = !locationSelect.value;
        run.textContent = "Consultar relatório";
      }
    });
    placeholder.append(section);
    loadAccounts();
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
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accounts", key: adminAccessKey })
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
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "audit", key: adminAccessKey, accountKey: accountSelect.value, locationId: locationSelect.value })
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
        const response = await fetch("/api/google/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: secret, action: "accounts" })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Não foi possível consultar as contas.");
        adminAccessKey = secret;
        window.rsaAdminAccessKey = secret;
        const accounts = data.accounts || [];
        const allLocations = accounts.filter(item => item.status === "connected").flatMap(account =>
          (account.locations || []).map(location => ({
            ...location,
            accountKey: account.id,
            accountLabel: account.label || "Conta Google"
          }))
        );
        window.dispatchEvent(new CustomEvent("rsa:all-locations-loaded", { detail: { locations: allLocations } }));
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
    if (view === "reports") renderReports();
    if (view === "create") renderCreateCompany();
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