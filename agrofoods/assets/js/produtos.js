/* Catálogo: filtro por nome, mercado e linha. Estado na URL (?mercado=&linha=&q=)
   para o link "Ver no catálogo" das páginas de mercado abrir já filtrado. */
(function () {
  "use strict";
  var form = document.querySelector("[data-filtros]");
  if (!form) return;
  var busca = form.querySelector("[data-filtro-busca]");
  var mercado = form.querySelector("[data-filtro-mercado]");
  var linha = form.querySelector("[data-filtro-linha]");
  var chips = document.querySelectorAll("[data-chip-mercado]");
  var itens = document.querySelectorAll("[data-grade-produtos] > li");
  var resultado = document.querySelector("[data-filtro-resultado]");
  var vazio = document.querySelector("[data-filtro-vazio]");
  var normaliza = function (t) { return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };

  function aplica(gravar) {
    var termo = normaliza(busca.value), m = mercado.value, l = linha.value, n = 0;
    itens.forEach(function (li) {
      var card = li.querySelector("[data-produto]");
      var ok = (!termo || normaliza(card.getAttribute("data-nome")).indexOf(termo) > -1) &&
               (!m || card.getAttribute("data-mercados").split(" ").indexOf(m) > -1) &&
               (!l || card.getAttribute("data-linha") === l);
      li.hidden = !ok;
      if (ok) n++;
    });
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-chip-mercado") === m)); });
    resultado.textContent = n === 1 ? "1 produto" : n + " produtos";
    vazio.hidden = n !== 0;
    if (gravar) {
      var p = new URLSearchParams();
      if (m) p.set("mercado", m); if (l) p.set("linha", l); if (busca.value.trim()) p.set("q", busca.value.trim());
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
    }
  }

  var inicial = new URLSearchParams(location.search);
  if (inicial.get("mercado")) mercado.value = inicial.get("mercado");
  if (inicial.get("linha")) linha.value = inicial.get("linha");
  if (inicial.get("q")) busca.value = inicial.get("q");

  busca.addEventListener("input", function () { aplica(true); });
  mercado.addEventListener("change", function () { aplica(true); });
  linha.addEventListener("change", function () { aplica(true); });
  chips.forEach(function (c) {
    c.addEventListener("click", function () { mercado.value = c.getAttribute("data-chip-mercado"); aplica(true); });
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  document.querySelectorAll("[data-filtro-limpar]").forEach(function (b) {
    // reset() não limpa campo oculto: o mercado volta a "todos" à mão
    b.addEventListener("click", function (e) { e.preventDefault(); form.reset(); mercado.value = ""; aplica(true); busca.focus(); });
  });
  aplica(false);
})();
