(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- local time, Ahmedabad ---------- */

  var clocks = document.querySelectorAll('[data-clock]');

  function istTime() {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date());
    } catch (err) {
      var d = new Date(Date.now() + 5.5 * 3600 * 1000);
      return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
    }
  }

  function updateClocks() {
    var time = istTime();
    clocks.forEach(function (el) { el.textContent = time; });
  }

  updateClocks();
  window.setInterval(updateClocks, 30000);

  /* ---------- interactive variable wordmark ---------- */

  var wordmark = document.getElementById('wordmark');
  var weightInput = document.getElementById('weightInput');
  var widthInput = document.getElementById('widthInput');
  var weightOut = document.getElementById('weightOut');
  var widthOut = document.getElementById('widthOut');
  var resetBtn = document.getElementById('resetAxes');

  var DEFAULTS = { wght: 640, wdth: 96 };
  var state = { wght: 320, wdth: 82 };
  var axisFrame = 0;
  var touched = false;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setAxes(wght, wdth) {
    wght = Math.round(clamp(wght, 250, 800) / 10) * 10;
    wdth = Math.round(clamp(wdth, 75, 100));
    state.wght = wght;
    state.wdth = wdth;
    wordmark.style.setProperty('--wght', String(wght));
    wordmark.style.setProperty('--wdth', String(wdth));
    weightInput.value = String(wght);
    widthInput.value = String(wdth);
    weightOut.textContent = String(wght);
    widthOut.textContent = String(wdth);
  }

  function stopAxisAnimation() {
    if (axisFrame) {
      window.cancelAnimationFrame(axisFrame);
      axisFrame = 0;
    }
  }

  function animateAxes(targetWght, targetWdth, duration) {
    stopAxisAnimation();
    if (prefersReduced.matches) {
      setAxes(targetWght, targetWdth);
      return;
    }
    var from = { wght: state.wght, wdth: state.wdth };
    var start = performance.now();
    var ms = duration || 1400;

    function step(now) {
      var t = Math.min(1, (now - start) / ms);
      var eased = 1 - Math.pow(1 - t, 3);
      setAxes(
        from.wght + (targetWght - from.wght) * eased,
        from.wdth + (targetWdth - from.wdth) * eased
      );
      if (t < 1) {
        axisFrame = window.requestAnimationFrame(step);
      } else {
        axisFrame = 0;
      }
    }

    axisFrame = window.requestAnimationFrame(step);
  }

  function onSliderInput() {
    touched = true;
    stopAxisAnimation();
    setAxes(Number(weightInput.value), Number(widthInput.value));
  }

  setAxes(state.wght, state.wdth);

  if (!prefersReduced.matches) {
    window.setTimeout(function () {
      if (!touched) animateAxes(DEFAULTS.wght, DEFAULTS.wdth, 1600);
    }, 280);
  } else {
    setAxes(DEFAULTS.wght, DEFAULTS.wdth);
  }

  weightInput.addEventListener('input', onSliderInput);
  widthInput.addEventListener('input', onSliderInput);

  resetBtn.addEventListener('click', function () {
    touched = true;
    animateAxes(DEFAULTS.wght, DEFAULTS.wdth, 650);
  });

  wordmark.addEventListener('pointermove', function (event) {
    if (event.pointerType === 'touch') return;
    var rect = wordmark.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var nx = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    var ny = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    touched = true;
    stopAxisAnimation();
    setAxes(800 - ny * 550, 75 + nx * 25);
  });

  /* ---------- type tester ---------- */

  var tester = document.getElementById('tester');

  if (tester) {
    var TESTER_FACES = {
      marginalia: {
        label: 'Marginalia',
        family: 'var(--font-text)',
        style: 'normal',
        wght: [200, 800, 350],
        wdth: null,
        sample: 'The quiet voice at the edge of the page.'
      },
      monsoon: {
        label: 'Monsoon Grotesk',
        family: 'var(--font-display)',
        style: 'normal',
        wght: [200, 800, 500],
        wdth: [75, 100, 88],
        sample: 'Sabarmati Line — Platform 2, 06:40.'
      },
      ledger: {
        label: 'Ledger Mono',
        family: 'var(--font-mono)',
        style: 'normal',
        wght: [100, 800, 400],
        wdth: [75, 112, 100],
        sample: 'Rs 1,24,500 — tabular figures, lakh grouping'
      },
      kesar: {
        label: 'Kesar',
        family: 'var(--font-text)',
        style: 'italic',
        wght: [200, 800, 300],
        wdth: null,
        sample: 'A festival face with a hooked terminal.'
      }
    };

    var tEl = {
      text: document.getElementById('testerText'),
      out: document.getElementById('testerOutput'),
      readout: document.getElementById('testerReadout'),
      size: document.getElementById('testerSize'),
      sizeOut: document.getElementById('testerSizeOut'),
      weight: document.getElementById('testerWeight'),
      weightOut: document.getElementById('testerWeightOut'),
      widthRow: document.getElementById('testerWidthRow'),
      width: document.getElementById('testerWidth'),
      widthOut: document.getElementById('testerWidthOut'),
      reset: document.getElementById('testerReset')
    };
    var faceBtns = Array.prototype.slice.call(tester.querySelectorAll('[data-face]'));
    var faceKey = 'marginalia';

    function lineHeightFor(px) {
      if (px > 110) return 0.92;
      if (px > 56) return 1.08;
      if (px > 28) return 1.35;
      return 1.6;
    }

    function growTesterText() {
      tEl.text.style.height = 'auto';
      tEl.text.style.height = tEl.text.scrollHeight + 'px';
    }

    function paintTester() {
      var face = TESTER_FACES[faceKey];
      var size = Number(tEl.size.value);
      var wght = Number(tEl.weight.value);
      var settings = '"wght" ' + wght;

      if (face.wdth) {
        settings += ', "wdth" ' + tEl.width.value;
        tEl.widthOut.textContent = tEl.width.value;
      }

      tEl.out.textContent = tEl.text.value.trim() ? tEl.text.value : face.sample;
      tEl.out.style.fontFamily = face.family;
      tEl.out.style.fontStyle = face.style;
      tEl.out.style.fontSize = size + 'px';
      tEl.out.style.lineHeight = String(lineHeightFor(size));
      tEl.out.style.fontVariationSettings = settings;

      tEl.sizeOut.textContent = String(size);
      tEl.weightOut.textContent = String(wght);
      tEl.readout.textContent = face.label + ' — ' + size + 'px · wght ' + wght +
        (face.wdth ? ' · wdth ' + tEl.width.value : '');

      growTesterText();
    }

    function selectFace(key) {
      var face = TESTER_FACES[key];
      faceKey = key;

      faceBtns.forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-face') === key));
      });

      tEl.weight.min = String(face.wght[0]);
      tEl.weight.max = String(face.wght[1]);
      tEl.weight.value = String(face.wght[2]);

      tEl.widthRow.hidden = !face.wdth;
      if (face.wdth) {
        tEl.width.min = String(face.wdth[0]);
        tEl.width.max = String(face.wdth[1]);
        tEl.width.value = String(face.wdth[2]);
      }

      paintTester();
    }

    faceBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectFace(btn.getAttribute('data-face'));
      });
    });

    [tEl.size, tEl.weight, tEl.width].forEach(function (input) {
      input.addEventListener('input', paintTester);
    });
    tEl.text.addEventListener('input', paintTester);

    tEl.reset.addEventListener('click', function () {
      tEl.size.value = '64';
      tEl.text.value = '';
      selectFace(faceKey);
    });

    selectFace(faceKey);
  }

  /* ---------- ambient light ---------- */

  if (!prefersReduced.matches) {
    var root = document.documentElement;
    var targetX = window.innerWidth * 0.62;
    var targetY = window.innerHeight * 0.28;
    var currentX = targetX;
    var currentY = targetY;
    var hasPointer = false;
    var lastTime = performance.now();

    window.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      targetX = event.clientX;
      targetY = event.clientY;
      hasPointer = true;
    }, { passive: true });

    var lightFrame = function (now) {
      var dt = Math.min(64, now - lastTime) / 1000;
      lastTime = now;

      var scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var progress = clamp(window.scrollY / scrollable, 0, 1);
      var idleX = hasPointer ? 0 : Math.sin(now / 7000) * window.innerWidth * 0.04;
      var driftX = Math.sin(progress * Math.PI * 2) * window.innerWidth * 0.07;
      var driftY = Math.sin(progress * Math.PI) * window.innerHeight * 0.2;
      var ease = 1 - Math.exp(-dt * 3.4);

      currentX += (targetX + driftX + idleX - currentX) * ease;
      currentY += (targetY + driftY - currentY) * ease;
      root.style.setProperty('--lx', currentX + 'px');
      root.style.setProperty('--ly', currentY + 'px');
      window.requestAnimationFrame(lightFrame);
    };

    window.requestAnimationFrame(lightFrame);
  }

  /* ---------- reveal on scroll ---------- */

  var revealEls = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- index menu ---------- */

  var menu = document.getElementById('menu');
  var menuBtn = document.getElementById('menuBtn');
  var menuClose = document.getElementById('menuClose');
  var lastFocused = null;

  function openMenu() {
    lastFocused = document.activeElement;
    menu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('menu-open');
    window.requestAnimationFrame(function () { menuClose.focus(); });
  }

  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  menuBtn.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);
  menu.querySelectorAll('a[href]').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeMenu();
      return;
    }
    if (event.key !== 'Tab' || menu.hidden) return;

    var focusables = Array.prototype.slice.call(
      menu.querySelectorAll('a[href], button:not([disabled])')
    );
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  var wideViewport = window.matchMedia('(min-width: 821px)');
  if (wideViewport.addEventListener) {
    wideViewport.addEventListener('change', function (event) {
      if (event.matches) closeMenu();
    });
  }
})();
