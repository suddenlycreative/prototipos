/* Formulários demonstrativos: validação acessível e confirmação local.
   Nunca envia nada: não há action, fetch nem armazenamento. */
(function () {
  "use strict";
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function mensagem(campo) {
    var v = (campo.value || "").trim();
    if (campo.type === "checkbox") return campo.required && !campo.checked ? "Confirme que leu a Política de Privacidade." : "";
    if (campo.required && !v) return "Preencha este campo.";
    if (campo.type === "email" && v && !EMAIL.test(v)) return "Informe um e-mail válido, como nome@empresa.com.br.";
    if (campo.minLength > 0 && v && v.length < campo.minLength) return "Escreva pelo menos " + campo.minLength + " caracteres.";
    return "";
  }

  function marca(campo, texto) {
    var erro = document.getElementById(campo.id + "-erro");
    campo.setAttribute("aria-invalid", texto ? "true" : "false");
    if (erro) {
      erro.textContent = texto;
      if (texto) campo.setAttribute("aria-describedby", erro.id); else campo.removeAttribute("aria-describedby");
    }
  }

  document.querySelectorAll("[data-form-demo]").forEach(function (form) {
    var campos = form.querySelectorAll("input:not([type=file]), select, textarea");
    var sucesso = form.querySelector("[data-form-sucesso]");
    campos.forEach(function (c) {
      // checkbox sempre tem value ("on"): só revalida no blur se já estava inválido, senão
      // passar pelo consentimento com Tab acusava erro sem a pessoa ter feito nada
      c.addEventListener("blur", function () { if (c.getAttribute("aria-invalid") === "true" || (c.type !== "checkbox" && c.value)) marca(c, mensagem(c)); });
      c.addEventListener("input", function () { if (c.getAttribute("aria-invalid") === "true") marca(c, mensagem(c)); });
    });
    // pré-seleção vinda dos cards de produto: ?assunto=...&produto=...
    var p = new URLSearchParams(location.search);
    ["assunto", "produto"].forEach(function (k) {
      var el = form.querySelector("[name=" + k + "]");
      if (el && p.get(k) && el.querySelector('option[value="' + p.get(k).replace(/[^a-z0-9-]/g, "") + '"]')) el.value = p.get(k);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var primeiro = null;
      campos.forEach(function (c) { var t = mensagem(c); marca(c, t); if (t && !primeiro) primeiro = c; });
      if (primeiro) { primeiro.focus(); return; }
      form.querySelectorAll(".form__grade, button[type=submit]").forEach(function (el) { el.hidden = true; });
      sucesso.hidden = false;
      sucesso.focus();
    });
  });
})();
