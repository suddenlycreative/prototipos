/* Rede BRR — comportamento do protótipo.
   Consentimento (LGPD) e eventos de conversão NÃO moram aqui: entram no build
   pelos módulos da casa (engine/modulos/). No WordPress o formulário vira o form
   nativo do Elementor (id form_principal); o tratamento de envio abaixo só vale
   para o protótipo, onde existe o <form id="lead-form">. */
(() => {
  'use strict';
  const doc = document.documentElement;
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduz && 'IntersectionObserver' in window) doc.classList.add('js-anima');

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------------- menu */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  const header = document.querySelector('.site-header');

  if (toggle && nav && header) {
    const setMenu = (isOpen) => {
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      header.classList.toggle('menu-is-open', isOpen);
      if (!isOpen) toggle.blur();
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (toggle.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
      if (event.matches && toggle.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  /* ------------------------------------- cabeçalho, progresso e topo */
  const barra = document.querySelector('.scroll-progress span');
  const topo = document.querySelector('.to-top');
  let pendente = false;
  const aoRolar = () => {
    pendente = false;
    const y = window.scrollY;
    const max = doc.scrollHeight - window.innerHeight;
    if (barra) barra.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    header?.classList.toggle('is-scrolled', y > 12);
    topo?.classList.toggle('is-visible', y > window.innerHeight * 0.9);
  };
  window.addEventListener('scroll', () => {
    if (!pendente) { pendente = true; requestAnimationFrame(aoRolar); }
  }, { passive: true });
  aoRolar();

  /* Seção visível acende o item do menu. */
  const links = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
  if (links.length && 'IntersectionObserver' in window) {
    const porId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const vigia = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        const link = porId.get(e.target.id);
        if (link && e.isIntersecting) {
          links.forEach((a) => a.classList.toggle('is-active', a === link));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    porId.forEach((_, id) => { const s = document.getElementById(id); if (s) vigia.observe(s); });
  }

  /* ------------------------------------------------ revelação e contadores */
  const anos = document.querySelector('[data-desde]');
  if (anos) {
    const total = new Date().getFullYear() - Number(anos.dataset.desde);
    anos.dataset.conta = String(total);
    anos.textContent = String(total);
  }

  const conta = (el) => {
    const alvo = Number(el.dataset.conta);
    const digitos = Number(el.dataset.digitos || 0);
    const fmt = (n) => String(n).padStart(digitos, '0');
    if (reduz || !alvo) { el.textContent = fmt(alvo); return; }
    const inicio = performance.now();
    const duracao = 1400;
    const passo = (agora) => {
      const t = Math.min((agora - inicio) / duracao, 1);
      el.textContent = fmt(Math.round(alvo * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };

  if ('IntersectionObserver' in window) {
    const revela = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        revela.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el) => revela.observe(el));

    const contadores = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        conta(e.target);
        contadores.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-conta]').forEach((el) => contadores.observe(el));
  }

  /* --------------------------------------- luz que segue o cursor no card */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.company-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ------------------- área escolhida na página já vem marcada no formulário */
  const campoArea = () => document.querySelector(
    '#lead-form select[name="solucao"], select[name="form_fields[solucao]"]');
  document.querySelectorAll('[data-area]').forEach((el) => {
    el.addEventListener('click', () => {
      const select = campoArea();
      if (!select) return;
      const opcao = [...select.options].find((o) => o.text.trim() === el.dataset.area);
      if (!opcao) return;
      select.value = opcao.value || opcao.text;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const campo = select.closest('.field, .elementor-field-group');
      if (campo) {
        campo.classList.remove('is-destacado', 'is-invalid');
        void campo.offsetWidth;
        campo.classList.add('is-destacado');
      }
    });
  });

  /* ------------------------------------------------ formulário (protótipo) */
  const form = document.getElementById('lead-form');
  if (!form) return;

  const tel = form.querySelector('input[name="whatsapp"]');
  tel?.addEventListener('input', () => {
    const d = tel.value.replace(/\D/g, '').slice(0, 11);
    let v = d;
    if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    tel.value = v;
  });

  const mensagens = {
    nome: 'Informe seu nome.',
    whatsapp: 'Informe um WhatsApp com DDD.',
    email: 'Informe um e-mail válido.',
    solucao: 'Escolha uma área.',
  };
  const marca = (campo, erro) => {
    const rotulo = campo.closest('.field');
    if (!rotulo) return;
    rotulo.classList.toggle('is-invalid', Boolean(erro));
    campo.setAttribute('aria-invalid', erro ? 'true' : 'false');
    let aviso = rotulo.querySelector('.field__erro');
    if (erro && !aviso) {
      aviso = document.createElement('span');
      aviso.className = 'field__erro';
      aviso.id = `erro-${campo.name}`;
      aviso.setAttribute('role', 'alert');
      rotulo.appendChild(aviso);
      campo.setAttribute('aria-describedby', aviso.id);
    }
    if (aviso) {
      if (erro) aviso.textContent = erro;
      else { aviso.remove(); campo.removeAttribute('aria-describedby'); }
    }
  };
  const valida = (campo) => {
    const ok = campo.checkValidity();
    marca(campo, ok ? '' : (mensagens[campo.name] || 'Confira este campo.'));
    return ok;
  };

  form.querySelectorAll('input, select, textarea').forEach((campo) => {
    campo.addEventListener('blur', () => { if (campo.value) valida(campo); });
    campo.addEventListener('input', () => {
      if (campo.closest('.field')?.classList.contains('is-invalid')) valida(campo);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const campos = [...form.querySelectorAll('input, select, textarea')];
    const invalidos = campos.filter((c) => !valida(c));
    if (invalidos.length) { invalidos[0].focus(); return; }

    const nome = (new FormData(form).get('nome') || '').toString().trim().split(/\s+/)[0];
    const altura = form.offsetHeight;
    form.style.minHeight = `${altura}px`;
    form.classList.add('is-enviado');
    form.innerHTML = '';
    const ok = document.createElement('div');
    ok.className = 'form-sucesso';
    ok.setAttribute('role', 'status');
    ok.innerHTML =
      '<span class="form-sucesso__icone"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg></span>'
      + '<strong></strong>'
      + '<p>No site publicado, sua mensagem segue por e-mail para a equipe da Rede BRR, '
      + 'direcionada à área que você escolheu.</p>'
      + '<small>Protótipo de apresentação: nenhum dado foi enviado ou armazenado.</small>'
      + '<button class="text-link" type="button">Enviar outra mensagem</button>';
    ok.querySelector('strong').textContent = nome ? `Tudo certo, ${nome}!` : 'Tudo certo!';
    ok.querySelector('button').addEventListener('click', () => window.location.reload());
    form.appendChild(ok);
  });
})();
