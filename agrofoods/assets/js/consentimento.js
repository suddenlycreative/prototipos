/* Agrofoods - consentimento de cookies (LGPD + Consent Mode v2). Sem dependências.
   Mesmo contrato de engine/modulos/consentimento.js, que o qa/fluxos.py mede:
     - o "consent default" negado nos quatro tipos está no <head> (base.html),
       antes de qualquer tag; aqui só a escolha da pessoa;
     - a escolha fica em localStorage['dl-consent'] = 'accept' | 'reject';
     - cada escolha emite gtag('consent','update') e {event:'cookie_consent'};
     - "Preferências de cookies" no rodapé reabre e revoga (LGPD, art. 18, IX). */
(function () {
  "use strict";
  var CONSENT_KEY = "dl-consent";
  var painel = document.querySelector("[data-consentimento]");
  if (!painel) return;
  var reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function ler() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function grava(v) { try { if (v) localStorage.setItem(CONSENT_KEY, v); else localStorage.removeItem(CONSENT_KEY); } catch (e) { /* modo anônimo */ } }

  function anuncia(estado) {
    var v = estado === "accept" ? "granted" : "denied";
    window.dataLayer.push({ event: "cookie_consent", consent_state: estado });
    window.gtag("consent", "update", { analytics_storage: v, ad_storage: v, ad_user_data: v, ad_personalization: v });
  }

  function mostra(foca) {
    painel.hidden = false;
    requestAnimationFrame(function () { painel.classList.add("is-visivel"); });
    if (foca) { var b = painel.querySelector("[data-consentir]"); if (b) b.focus(); }
  }
  function esconde() {
    painel.classList.remove("is-visivel");
    setTimeout(function () { painel.hidden = true; }, reduzMovimento ? 0 : 320);
  }

  painel.addEventListener("click", function (e) {
    var b = e.target.closest("[data-consentir]");
    if (!b) return;
    var escolha = b.getAttribute("data-consentir");
    grava(escolha);
    anuncia(escolha);
    esconde();
  });

  document.querySelectorAll("[data-abre-consentimento]").forEach(function (b) {
    b.addEventListener("click", function () { grava(null); anuncia("reject"); mostra(true); });
  });

  var escolhido = ler();
  if (escolhido) {
    anuncia(escolhido);
  } else {
    // espera a primeira rolagem ou 1,2 s, para não competir com o topo da página
    var armado = false;
    var abre = function () { if (!armado) { armado = true; mostra(false); } };
    setTimeout(abre, 1200);
    window.addEventListener("scroll", abre, { once: true, passive: true });
  }
})();
