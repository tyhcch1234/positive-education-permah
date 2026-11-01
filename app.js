/* =========================================================
   PERMAH 正向教育 · 互動
   1. 導覽（手機選單、滾動狀態、目前區塊）
   2. PERMAH 分頁（滑鼠 + 鍵盤）
   3. 自我檢視雷達圖
   4. 進場動畫、回到頂部、閱讀進度
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. 導覽 ---------- */
  const header = document.getElementById('siteHeader');
  const burger = document.getElementById('burger');
  const navlinks = document.getElementById('navlinks');
  const scrollbar = document.getElementById('scrollbar');
  const toTop = document.getElementById('toTop');

  if (burger && navlinks) {
    burger.addEventListener('click', () => {
      const open = navlinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    });
    navlinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        navlinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const onScroll = () => {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollbar) scrollbar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (header) header.classList.toggle('scrolled', y > 8);
    if (toTop) toTop.classList.toggle('show', y > 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* 目前區塊高亮 */
  const links = Array.from(document.querySelectorAll('.navlinks a[href^="#"]'));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((l) =>
            l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id)
          );
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- 2. PERMAH 分頁 ---------- */
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const panels = Array.from(document.querySelectorAll('.panel'));
  const order = ['p', 'e', 'r', 'm', 'a', 'h'];

  function activate(key, focusTab) {
    tabs.forEach((t) => {
      const on = t.dataset.target === key;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
    });
    panels.forEach((p) => {
      const on = p.id === 'panel-' + key;
      p.hidden = !on;
      if (on) {
        p.animate(
          [
            { opacity: 0, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' }
        );
      }
    });
    // 讓分頁在上方時保持可見
    if (window.innerWidth <= 900) {
      const active = document.querySelector('.tab[aria-selected="true"]');
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab.dataset.target, false));
    tab.addEventListener('keydown', (e) => {
      const i = order.indexOf(tab.dataset.target);
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % order.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + order.length) % order.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = order.length - 1;
      if (next !== null) {
        e.preventDefault();
        activate(order[next], true);
      }
    });
  });

  document.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => activate(btn.dataset.goto, false));
  });

  /* ---------- 3. 自我檢視雷達圖 ---------- */
  const CX = 170;
  const CY = 160;
  const R = 100;
  const KEYS = ['p', 'e', 'r', 'm', 'a', 'h'];
  const LABELS = {
    p: 'P 正向情緒',
    e: 'E 投入',
    r: 'R 關係',
    m: 'M 意義',
    a: 'A 成就',
    h: 'H 健康',
  };
  const COLORS = {
    p: '#DE6547',
    e: '#C9942F',
    r: '#0E6B63',
    m: '#6F63A8',
    a: '#2F7E96',
    h: '#5E8B4E',
  };
  const TIPS = {
    p: '這星期試試睡前寫 3 件好事，並補一句「為什麼」。',
    e: '找一科最不想開的，設 25 分鐘計時器，只做這一科。',
    r: '主動問一個同學「你最近點呀？」，然後聽多過講。',
    m: '幫一個人一件小事，並記下因為你而順暢了的那件事。',
    a: '把一個大目標切到「本星期做得到」，完成就打勾。',
    h: '今晚早 30 分鐘放低手機，並試 20 分鐘運動。',
  };

  const angle = (i) => (Math.PI / 3) * i - Math.PI / 2;
  const pt = (i, radius) => [
    CX + Math.cos(angle(i)) * radius,
    CY + Math.sin(angle(i)) * radius,
  ];

  function drawGrid() {
    const grid = document.getElementById('radarGrid');
    if (!grid) return;
    const levels = 5;
    let html = '';
    for (let lv = 1; lv <= levels; lv++) {
      const r = (R * lv) / levels;
      const pts = KEYS.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
      html += `<polygon class="grid-line" points="${pts}"/>`;
    }
    KEYS.forEach((_, i) => {
      const [x, y] = pt(i, R);
      html += `<line class="axis" x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    });
    grid.innerHTML = html;

    const labels = document.getElementById('radarLabels');
    if (labels) {
      let lab = '';
      KEYS.forEach((k, i) => {
        const [x, y] = pt(i, R + 24);
        const a = angle(i);
        const cos = Math.cos(a);
        let anchor = 'middle';
        if (cos > 0.3) anchor = 'start';
        else if (cos < -0.3) anchor = 'end';
        lab += `<text class="axis-label" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">${LABELS[k]}</text>`;
      });
      labels.innerHTML = lab;
    }
  }

  function update() {
    const vals = {};
    KEYS.forEach((k) => {
      const input = document.getElementById('s-' + k);
      const out = document.getElementById('o-' + k);
      const v = input ? Number(input.value) : 3;
      vals[k] = v;
      if (out) out.textContent = v;
      if (input) input.style.setProperty('--pct', ((v - 1) / 4) * 100 + '%');
    });

    const shape = document.getElementById('radarShape');
    const dots = document.getElementById('radarDots');
    if (shape) {
      const pts = KEYS.map((k, i) => pt(i, (vals[k] / 5) * R).map((n) => n.toFixed(1)).join(',')).join(' ');
      shape.setAttribute('points', pts);
    }
    if (dots) {
      dots.innerHTML = KEYS.map((k, i) => {
        const [x, y] = pt(i, (vals[k] / 5) * R);
        return `<circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.4" fill="${COLORS[k]}"/>`;
      }).join('');
    }

    const total = KEYS.reduce((s, k) => s + vals[k], 0);
    const num = document.getElementById('radarCenterNum');
    if (num) num.textContent = total;

    const readout = document.getElementById('readout');
    if (readout) {
      const min = Math.min(...KEYS.map((k) => vals[k]));
      const lowKeys = KEYS.filter((k) => vals[k] === min);
      let head;
      if (total >= 25) head = '你的六格相當平均而飽滿。';
      else if (total >= 18) head = '整體中上，有幾格可以再厚一點。';
      else if (total >= 12) head = '有明顯凹陷的位置，這很正常——先處理最凹那一格。';
      else head = '現在可能是有點吃力的時期。先顧好健康與關係，其他慢慢來。';

      const tipKey = lowKeys.includes('h') && min <= 2 ? 'h' : lowKeys[0];
      readout.innerHTML =
        head +
        ' 最需要補充的是 <b>' + LABELS[tipKey] + '</b>。' +
        TIPS[tipKey] +
        '<br><span style="font-size:.78rem;color:var(--muted)">（分數只供自我參考，不是診斷）</span>';
    }
  }

  drawGrid();
  document.querySelectorAll('input[type=range]').forEach((input) => {
    input.addEventListener('input', update);
  });
  update();

  /* ---------- 4. 進場動畫 ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* 尊重減少動態偏好時，直接顯示 */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach((el) => el.classList.add('in'));
  }
})();
