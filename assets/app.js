(() => {
  'use strict';

  const TOTAL_PAGES = 37;
  const pad = (n) => String(n).padStart(2, '0');
  const pageSrc = (n) => `pages/p${pad(n)}.jpg`;

  const pagesEl = document.getElementById('pages');

  /* ---------- build the page stack ---------- */

  const figures = [];
  for (let i = 1; i <= TOTAL_PAGES; i++) {
    const fig = document.createElement('figure');
    fig.className = 'page';
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', `Page ${i} of ${TOTAL_PAGES}. Open larger view.`);

    const img = document.createElement('img');
    img.src = pageSrc(i);
    img.alt = `Brochure page ${i} of ${TOTAL_PAGES}`;
    img.decoding = 'async';
    img.loading = i <= 2 ? 'eager' : 'lazy';
    img.addEventListener('load', () => fig.classList.add('is-ready'), { once: true });
    img.addEventListener('error', () => fig.classList.add('is-ready'), { once: true });

    const num = document.createElement('span');
    num.className = 'page-num';
    num.textContent = i;

    fig.append(img, num);
    fig.addEventListener('click', () => open(i));
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });

    figures.push(fig);
    pagesEl.appendChild(fig);
  }

  /* ---------- lightbox ---------- */

  const box = document.getElementById('lightbox');
  const stage = box.querySelector('[data-lb-stage]');
  const lbImg = document.getElementById('lbImg');
  const lbCount = document.getElementById('lbCount');
  const skeleton = box.querySelector('.lb-skeleton');

  let current = 0;
  let openState = false;
  let fromHistory = false;

  function reveal() {
    lbImg.classList.add('is-shown');
    skeleton.style.opacity = '0';
  }

  function paint(n) {
    current = n;
    lbImg.alt = `Brochure page ${n} of ${TOTAL_PAGES}`;
    lbCount.textContent = `${n} / ${TOTAL_PAGES}`;
    const src = pageSrc(n);
    /* Re-assigning an identical src fires no `load` event, which would leave the
       image stuck at opacity 0 — so reuse whatever is already on screen. */
    if (lbImg.getAttribute('src') === src && lbImg.complete && lbImg.naturalWidth > 0) {
      reveal();
      return;
    }
    lbImg.classList.remove('is-shown');
    skeleton.style.opacity = '';
    lbImg.src = src;
  }

  lbImg.addEventListener('load', () => {
    reveal();
    if (current > 1) new Image().src = pageSrc(current - 1);
    if (current < TOTAL_PAGES) new Image().src = pageSrc(current + 1);
  });

  function open(n) {
    if (!openState) {
      openState = true;
      box.hidden = false;
      document.body.classList.add('is-locked');
      history.pushState({ lb: true }, '');
      requestAnimationFrame(() => box.classList.add('is-open'));
    }
    paint(n);
  }

  function close() {
    if (!openState) return;
    openState = false;
    box.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    const done = () => {
      box.hidden = true;
    };
    setTimeout(done, 300);
    if (!fromHistory && history.state && history.state.lb) history.back();
    fromHistory = false;
  }

  window.addEventListener('popstate', () => {
    if (openState) {
      fromHistory = true;
      close();
    }
  });

  box.querySelector('[data-lb-close]').addEventListener('click', close);
  box.querySelector('[data-lb-prev]').addEventListener('click', (e) => {
    e.stopPropagation();
    if (current > 1) paint(current - 1);
  });
  box.querySelector('[data-lb-next]').addEventListener('click', (e) => {
    e.stopPropagation();
    if (current < TOTAL_PAGES) paint(current + 1);
  });

  stage.addEventListener('click', (e) => {
    if (e.target === lbImg) {
      const r = lbImg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right) close();
    } else if (e.target === stage) {
      close();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (!openState) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' && current > 1) paint(current - 1);
    if (e.key === 'ArrowRight' && current < TOTAL_PAGES) paint(current + 1);
  });

  let startX = 0;
  let startY = 0;
  let pinching = false;

  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      pinching = true;
      return;
    }
    startX = e.changedTouches[0].clientX;
    startY = e.changedTouches[0].clientY;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    if (pinching) {
      if (e.touches.length === 0) pinching = false;
      return;
    }
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 55 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && current < TOTAL_PAGES) paint(current + 1);
    if (dx > 0 && current > 1) paint(current - 1);
  }, { passive: true });

  /* ---------- share ---------- */

  const shareBtn = document.querySelector('[data-share]');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const data = {
        title: 'In Loving Memory of Mrs. Regina Dartebea Opare',
        text: 'Burial & Memorial Service — Saturday, 7th November 2026.',
        url: location.href,
      };
      try {
        if (navigator.share) {
          await navigator.share(data);
        } else {
          await navigator.clipboard.writeText(location.href);
          const label = shareBtn.lastChild;
          shareBtn.dataset.done = '1';
          if (label) label.textContent = ' Link copied';
          setTimeout(() => { if (label) label.textContent = ' Share'; }, 2000);
        }
      } catch (_) { /* dismissed */ }
    });
  }
})();
