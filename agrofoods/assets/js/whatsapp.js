/* Agrofoods - botão de WhatsApp com formulário (form_wpp). Sem dependências.
   Mesmo contrato de engine/modulos/conversao.js e docs/VALIDACAO-CONVERSAO.md:
     {event:'form_start', form_id}     na primeira interação com o formulário
     {event:'form_submit', form_id}    só no envio válido
     {event:'whatsapp_click', form_id, link_url}
   Cada evento sai por dataLayer.push E por gtag (ARMADILHAS #41), e a saída é
   um clique num <a href="https://wa.me/...">, nunca location.assign (#40).
   Nada de dado pessoal no dataLayer: a mensagem leva só o assunto.
   Protótipo: nada é enviado nem armazenado. Sem número (data-numero vazio), mostra
   a mensagem que iria e não sai do site. */
(function () {
  "use strict";
  var dialogo = document.querySelector("[data-wpp]");
  if (!dialogo || typeof dialogo.showModal !== "function") return;
  var form = dialogo.querySelector("[data-wpp-form]");
  var sucesso = dialogo.querySelector("[data-wpp-sucesso]");
  var status = dialogo.querySelector("[data-wpp-status]");
  var previa = dialogo.querySelector("[data-wpp-previa]");
  var saida = dialogo.querySelector("[data-wpp-link]");
  var numero = (dialogo.getAttribute("data-numero") || "").replace(/\D/g, "");
  var marca = dialogo.getAttribute("data-marca") || "";
  var iniciado = false;

  window.dataLayer = window.dataLayer || [];
  function evento(nome, dados) {
    window.dataLayer.push(Object.assign({ event: nome }, dados));
    if (typeof window.gtag === "function") window.gtag("event", nome, dados);
  }

  /* máscara (XX) XXXXX-XXXX, igual à do módulo da casa */
  function mascara(valor) {
    var d = valor.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
    if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, "($1) $2");
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  }

  var campos = {
    nome: form.querySelector("#w-nome"),
    whatsapp: form.querySelector("#w-whatsapp"),
    consente: form.querySelector("#w-consente")
  };
  function mensagemErro(nome, campo) {
    if (nome === "nome") return campo.value.trim().length < 2 ? "Informe seu nome." : "";
    if (nome === "whatsapp") {
      var d = campo.value.replace(/\D/g, "");
      return d.length < 10 ? "Informe um WhatsApp com DDD, como (16) 99999-0000." : "";
    }
    return campo.checked ? "" : "Confirme que leu a Política de Privacidade.";
  }
  function marcaCampo(campo, texto) {
    var erro = document.getElementById(campo.id + "-erro");
    campo.setAttribute("aria-invalid", texto ? "true" : "false");
    if (texto) campo.setAttribute("aria-describedby", erro.id); else campo.removeAttribute("aria-describedby");
    erro.textContent = texto;
  }

  campos.whatsapp.addEventListener("input", function () {
    var noFim = campos.whatsapp.selectionStart === campos.whatsapp.value.length;
    campos.whatsapp.value = mascara(campos.whatsapp.value);
    if (noFim) campos.whatsapp.setSelectionRange(campos.whatsapp.value.length, campos.whatsapp.value.length);
  });
  Object.keys(campos).forEach(function (nome) {
    var c = campos[nome];
    c.addEventListener(nome === "consente" ? "change" : "input", function () {
      if (c.getAttribute("aria-invalid") === "true") marcaCampo(c, mensagemErro(nome, c));
    });
  });
  form.addEventListener("focusin", function () {
    if (iniciado) return;
    iniciado = true;
    evento("form_start", { form_id: form.id });
  });

  function abre() {
    form.hidden = false;
    sucesso.hidden = true;
    saida.hidden = true;
    dialogo.showModal();
    campos.nome.focus();
  }
  document.querySelectorAll("[data-abre-wpp]").forEach(function (b) { b.addEventListener("click", abre); });
  dialogo.querySelector("[data-fecha-wpp]").addEventListener("click", function () { dialogo.close(); });
  dialogo.addEventListener("click", function (e) { if (e.target === dialogo) dialogo.close(); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var primeiro = null;
    Object.keys(campos).forEach(function (nome) {
      var t = mensagemErro(nome, campos[nome]);
      marcaCampo(campos[nome], t);
      if (t && !primeiro) primeiro = campos[nome];
    });
    if (primeiro) { primeiro.focus(); return; }

    evento("form_submit", { form_id: form.id });
    var opcao = form.querySelector("#w-solucao").selectedOptions[0];
    var assunto = opcao ? opcao.getAttribute("data-msg") : "";
    var texto = "Olá! Vim pela página da " + marca + (assunto ? " e gostaria de saber mais sobre " + assunto + "." : " e gostaria de atendimento.");
    previa.textContent = texto;
    form.hidden = true;
    sucesso.hidden = false;

    if (!numero) {
      status.textContent = "Demonstração: com o número confirmado, a conversa abriria no WhatsApp com esta mensagem.";
      sucesso.focus();
      return;
    }
    var url = "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto);
    saida.href = url;
    saida.hidden = false;
    status.textContent = "Abrindo o WhatsApp…";
    sucesso.focus();
    evento("whatsapp_click", { form_id: form.id, link_url: url });
    // sai por CLIQUE no <a>: é o que o GA4 conta como clique de saída
    setTimeout(function () { saida.click(); }, 500);
  });
})();
