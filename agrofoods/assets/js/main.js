/* Agrofoods - comportamento comum a todas as páginas. Sem dependências.
   Cabeçalho, submenus, gaveta mobile, busca, hero, carrossel e entrada de seções. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- cabeçalho: sombra ao rolar ---------- */
  var cabecalho = document.querySelector("[data-cabecalho]");
  if (cabecalho) {
    var marca = function () { cabecalho.classList.toggle("is-rolado", window.scrollY > 8); };
    marca();
    window.addEventListener("scroll", marca, { passive: true });
  }

  /* ---------- submenus: hover no mouse, botão no teclado e no toque ---------- */
  var itens = document.querySelectorAll(".menu__item--sub");
  function fechaSubmenus(exceto) {
    itens.forEach(function (item) {
      if (item === exceto) return;
      item.classList.remove("is-aberto");
      var b = item.querySelector(".menu__abre");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }
  itens.forEach(function (item) {
    var botao = item.querySelector(".menu__abre");
    botao.addEventListener("click", function () {
      var abrir = !item.classList.contains("is-aberto");
      fechaSubmenus(item);
      item.classList.toggle("is-aberto", abrir);
      botao.setAttribute("aria-expanded", String(abrir));
      if (abrir) { var primeiro = item.querySelector(".submenu a"); if (primeiro) primeiro.focus(); }
    });
    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && item.classList.contains("is-aberto")) {
        fechaSubmenus(); botao.focus();
      }
    });
    item.addEventListener("focusout", function (e) {
      if (!item.contains(e.relatedTarget)) { item.classList.remove("is-aberto"); botao.setAttribute("aria-expanded", "false"); }
    });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".menu__item--sub")) fechaSubmenus(); });

  /* ---------- gaveta mobile com foco preso ---------- */
  var gaveta = document.querySelector("[data-gaveta]");
  var abreGaveta = document.querySelector("[data-abre-gaveta]");
  function focaveis(raiz) {
    return Array.prototype.filter.call(
      raiz.querySelectorAll("a[href], button:not([disabled]), summary, input, select, textarea"),
      function (el) { return el.offsetParent !== null; });
  }
  function fechaGaveta() {
    if (!gaveta || gaveta.hidden) return;
    gaveta.hidden = true;
    document.body.style.overflow = "";
    abreGaveta.setAttribute("aria-expanded", "false");
    abreGaveta.focus();
  }
  if (gaveta && abreGaveta) {
    abreGaveta.addEventListener("click", function () {
      gaveta.hidden = false;
      document.body.style.overflow = "hidden";
      abreGaveta.setAttribute("aria-expanded", "true");
      var f = focaveis(gaveta); if (f.length) f[0].focus();
    });
    gaveta.querySelectorAll("[data-fecha-gaveta]").forEach(function (b) { b.addEventListener("click", fechaGaveta); });
    gaveta.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { fechaGaveta(); return; }
      if (e.key !== "Tab") return;
      var f = focaveis(gaveta), primeiro = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    });
    window.matchMedia("(min-width: 1141px)").addEventListener("change", function (m) { if (m.matches) fechaGaveta(); });
  }

  /* ---------- busca: índice local, sem servidor ---------- */
  var busca = document.querySelector("[data-busca]");
  if (busca && typeof busca.showModal === "function") {
    var campo = busca.querySelector("[data-busca-campo]");
    var lista = busca.querySelector("[data-busca-resultados]");
    var raiz = busca.getAttribute("data-raiz");
    var indice = null;
    var normaliza = function (t) { return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
    var carrega = function () {
      if (indice) return Promise.resolve(indice);
      return fetch(busca.getAttribute("data-indice")).then(function (r) { return r.json(); })
        .then(function (dados) { indice = dados.map(function (d) { d.n = normaliza(d.t + " " + d.d); return d; }); return indice; });
    };
    var escapa = function (t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; };
    var mostra = function () {
      var termo = normaliza(campo.value.trim());
      if (termo.length < 2) { lista.innerHTML = ""; return; }
      var partes = termo.split(/\s+/);
      var achados = indice.filter(function (d) { return partes.every(function (p) { return d.n.indexOf(p) > -1; }); }).slice(0, 8);
      lista.innerHTML = achados.length ? achados.map(function (d) {
        return '<li><a href="' + (raiz === "./" ? "" : raiz) + d.u + '"><em>' + d.k + "</em><strong>" + escapa(d.t) + "</strong><small>" + escapa(d.d) + "</small></a></li>";
      }).join("") : '<li class="busca__vazio"><small>Nada encontrado para “' + escapa(campo.value) + "”.</small></li>";
    };
    document.querySelectorAll("[data-abre-busca]").forEach(function (b) {
      b.addEventListener("click", function () { busca.showModal(); campo.focus(); carrega().then(mostra); });
    });
    busca.querySelector("[data-fecha-busca]").addEventListener("click", function () { busca.close(); });
    busca.addEventListener("click", function (e) { if (e.target === busca) busca.close(); });
    campo.addEventListener("input", function () { carrega().then(mostra); });
    campo.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { var a = lista.querySelector("a"); if (a) { e.preventDefault(); a.focus(); } }
      if (e.key === "Enter") { e.preventDefault(); var p = lista.querySelector("a"); if (p) p.click(); }
    });
    lista.addEventListener("keydown", function (e) {
      var links = Array.prototype.slice.call(lista.querySelectorAll("a"));
      var i = links.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && i < links.length - 1) { e.preventDefault(); links[i + 1].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); (i > 0 ? links[i - 1] : campo).focus(); }
    });
  }

  /* ---------- hero: crossfade, pausa em interação, sem rotação com movimento reduzido ---------- */
  var hero = document.querySelector("[data-hero]");
  if (hero) {
    var slides = hero.querySelectorAll("[data-hero-slide]");
    var anterior = hero.querySelector("[data-hero-anterior]");
    var proximo = hero.querySelector("[data-hero-proximo]");
    var atual = 0, timer = null, emInteracao = false;
    var INTERVALO = 7000;
    var vai = function (n) {
      atual = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var ativo = i === atual;
        s.classList.toggle("is-ativo", ativo);
        s.setAttribute("aria-hidden", String(!ativo));
        if (ativo) s.removeAttribute("inert"); else s.setAttribute("inert", "");
        if (ativo) s.querySelectorAll("img[loading=lazy]").forEach(function (im) { im.loading = "eager"; });
      });
      hero.classList.toggle("hero--frascos", slides[atual].classList.contains("hero__slide--frascos"));
    };
    var agenda = function () {
      clearInterval(timer);
      if (!reduzMovimento && !emInteracao && !document.hidden) timer = setInterval(function () { vai(atual + 1); }, INTERVALO);
    };
    anterior.addEventListener("click", function () { vai(atual - 1); agenda(); });
    proximo.addEventListener("click", function () { vai(atual + 1); agenda(); });
    hero.addEventListener("keydown", function (e) {
      if (e.target !== hero && !e.target.closest("[data-hero-slide]")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        vai(atual + (e.key === "ArrowRight" ? 1 : -1));
        agenda();
      }
    });
    // toque: arrastar para o lado troca o destaque; gesto mais vertical que horizontal é rolagem da página
    var x0 = null, y0 = 0;
    hero.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { vai(atual + (dx < 0 ? 1 : -1)); agenda(); }
    }, { passive: true });
    hero.addEventListener("mouseenter", function () { emInteracao = true; agenda(); });
    hero.addEventListener("mouseleave", function () { emInteracao = false; agenda(); });
    hero.addEventListener("focusin", function () { emInteracao = true; agenda(); });
    hero.addEventListener("focusout", function (e) { if (!hero.contains(e.relatedTarget)) { emInteracao = false; agenda(); } });
    document.addEventListener("visibilitychange", agenda);
    vai(0);
    // os slides 2 e 3 só baixam depois que a página terminou de carregar
    window.addEventListener("load", function () {
      setTimeout(function () { hero.querySelectorAll("img[loading=lazy]").forEach(function (im) { im.loading = "eager"; }); }, 1500);
      agenda();
    });
  }

  /* ---------- carrossel: scroll-snap nativo + setas + pontos ---------- */
  document.querySelectorAll("[data-carrossel]").forEach(function (car) {
    var trilho = car.querySelector("[data-carrossel-trilho]");
    var ant = car.querySelector("[data-carrossel-ant]");
    var prox = car.querySelector("[data-carrossel-prox]");
    var passo = function () { var item = trilho.querySelector(".carrossel__item"); return item ? item.getBoundingClientRect().width + (parseFloat(getComputedStyle(trilho).columnGap) || 0) : trilho.clientWidth; };
    var atualiza = function () {
      var max = trilho.scrollWidth - trilho.clientWidth - 2;
      ant.disabled = trilho.scrollLeft <= 2;
      prox.disabled = trilho.scrollLeft >= max;
      car.classList.toggle("is-estatico", max <= 0);
    };
    ant.addEventListener("click", function () { trilho.scrollBy({ left: -passo(), behavior: reduzMovimento ? "auto" : "smooth" }); });
    prox.addEventListener("click", function () { trilho.scrollBy({ left: passo(), behavior: reduzMovimento ? "auto" : "smooth" }); });
    trilho.addEventListener("keydown", function (e) {
      if (e.target !== trilho) return;
      if (e.key === "ArrowRight") { e.preventDefault(); prox.click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); ant.click(); }
    });
    var t; trilho.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(atualiza, 60); }, { passive: true });
    window.addEventListener("resize", atualiza);
    atualiza();
  });

  /* ---------- entrada leve das seções abaixo da dobra ---------- */
  if ("IntersectionObserver" in window && !reduzMovimento) {
    var alvos = document.querySelectorAll(".intro, .bloco, .card-unidade, .card-doc, .certs, .card-produto, .numeros li, .valores li, .historia__texto, .sust-home__texto, .texto-longo");
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visivel"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    alvos.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.setAttribute("data-revelar", ""); io.observe(el); }
    });
  }

  /* ---------- parallax só na foto do hero: 30% da rolagem, até 120 px ---------- */
  var camadas = document.querySelectorAll("[data-parallax]");
  if (camadas.length && !reduzMovimento) {
    var largo = window.matchMedia("(min-width: 901px)");
    var pedido = false;
    var move = function () {
      pedido = false;
      var y = largo.matches ? Math.min(window.scrollY * 0.3, 120) : 0;
      camadas.forEach(function (c) { c.style.setProperty("--plx", y.toFixed(1) + "px"); });
    };
    window.addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(move); } }, { passive: true });
    largo.addEventListener("change", move);
    move();
  }

  document.querySelectorAll("[data-ano]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
