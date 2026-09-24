/* ═══════════════════════════════════════════════════════════
   ECOGUIDE — Animations & interactions
   Parallaxe, révélations au scroll, compteurs, sentier animé,
   feuilles flottantes, tilt 3D — le tout en rAF, sans librairie.
   ═══════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* Points de rupture partagés avec la feuille de style. On interroge
     matchMedia à la demande : la valeur suit la rotation de l'écran. */
  const isMobile    = () => window.matchMedia("(max-width: 860px)").matches;
  const isCarousel  = () => window.matchMedia("(max-width: 720px)").matches;

  /* Centre un élément dans sa bande défilante horizontale. Calculs en
     coordonnées écran : valable quel que soit le parent positionné.   */
  const centerInScroller = (scroller, el, smooth = true) => {
    const box = scroller.getBoundingClientRect();
    const item = el.getBoundingClientRect();
    const left = scroller.scrollLeft + (item.left - box.left) - (box.width - item.width) / 2;
    scroller.scrollTo({ left, behavior: smooth && !prefersReducedMotion ? "smooth" : "auto" });
  };

  /* ── Navigation & tiroir mobile ─────────────────────────── */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");
  const navScrim = document.getElementById("navScrim");

  const setMenu = (open) => {
    navLinks.classList.toggle("open", open);
    // Le corps ne défile plus derrière le tiroir (classe lue par le CSS)
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  };

  burger.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
  if (navScrim) navScrim.addEventListener("click", () => setMenu(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("open")) {
      setMenu(false);
      burger.focus();
    }
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  // Retour au menu horizontal (rotation, redimensionnement) : on referme
  window.addEventListener("resize", () => {
    if (!isMobile() && navLinks.classList.contains("open")) setMenu(false);
  }, { passive: true });

  /* ── Captures réelles de l'application ──────────────────
     Chaque téléphone contient une maquette CSS et, par-dessus, la vraie
     capture. Tant que le fichier JPEG n'est pas déposé dans images/,
     l'image échoue au chargement : on la retire et la maquette reste
     visible. Aucune icône d'image cassée n'apparaît.                   */
  document.querySelectorAll(".phone-shot").forEach((img) => {
    const reveal = () => img.closest(".phone-screen").classList.add("has-shot");

    img.addEventListener("load", reveal);
    img.addEventListener("error", () => img.remove());

    // Une image en cache peut déjà être chargée avant l'écoute.
    if (img.complete) {
      if (img.naturalWidth > 0) reveal();
      else img.remove();
    }
  });

  /* ── Vidéo de démonstration ─────────────────────────────
     Lecture au CLIC, avec le son. Aucun autoplay : le clic étant un
     geste utilisateur, le navigateur autorise le son sans réserve.
     La vidéo n'est téléchargée qu'au premier clic (preload="none").  */
  const demoVideo = document.getElementById("demoVideo");

  if (demoVideo) {
    const phone   = document.querySelector(".demo-phone");
    const playBtn = document.getElementById("demoPlay");
    const playIcon= document.getElementById("demoPlayIcon");
    const hint    = document.getElementById("demoHint");
    const toggle  = document.getElementById("demoToggle");
    const sound   = document.getElementById("demoSound");
    const track   = document.getElementById("demoTrack");
    const fill    = document.getElementById("demoFill");
    const timeEl  = document.getElementById("demoTime");
    const chaps   = [...document.querySelectorAll(".chap")];
    const starts  = chaps.map((c) => parseFloat(c.dataset.t));

    const ICON_PLAY  = "M8 5.5v13l11-6.5-11-6.5Z";
    const ICON_PAUSE = "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z";
    // L'incrustation centrale affiche un simple triangle « Lire »
    playIcon.setAttribute("stroke", "none");
    playIcon.setAttribute("fill", "currentColor");
    playIcon.innerHTML = '<path d="M8 5.5v13l11-6.5-11-6.5Z"/>';
    hint.textContent = "Lire la démonstration";
    playBtn.setAttribute("aria-label", "Lire la démonstration avec le son");

    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const setBarIcon = (d) => toggle.querySelector("path").setAttribute("d", d);

    // Lecture AVEC le son (déclenchée par un geste utilisateur)
    const play = () => {
      demoVideo.muted = false;
      sound.classList.remove("is-muted");
      sound.setAttribute("aria-pressed", "false");
      phone.classList.add("is-playing");   // masque l'incrustation centrale
      demoVideo.play().catch(() => {});
    };

    /* Se positionner puis lire. Avec preload="none" la vidéo n'a aucune
       métadonnée au premier clic : écrire currentTime serait sans effet.
       On attend alors « loadedmetadata », déclenché par play().          */
    const seekAndPlay = (time) => {
      if (demoVideo.readyState >= 1) {
        demoVideo.currentTime = time;
      } else {
        demoVideo.addEventListener("loadedmetadata", () => { demoVideo.currentTime = time; }, { once: true });
      }
      play();
    };

    playBtn.addEventListener("click", play);

    toggle.addEventListener("click", () => {
      demoVideo.paused ? play() : demoVideo.pause();
    });

    demoVideo.addEventListener("play",  () => setBarIcon(ICON_PAUSE));
    demoVideo.addEventListener("pause", () => {
      setBarIcon(ICON_PLAY);
      phone.classList.remove("is-playing"); // réaffiche le bouton « Lire »
    });

    demoVideo.addEventListener("ended", () => {
      phone.classList.remove("is-playing");
      demoVideo.currentTime = 0;
      fill.style.width = "0%";
      timeEl.textContent = "0:00";
      chaps.forEach((c) => c.classList.remove("is-live"));
      liveIndex = -1;
    });

    sound.addEventListener("click", () => {
      demoVideo.muted = !demoVideo.muted;
      sound.classList.toggle("is-muted", demoVideo.muted);
      sound.setAttribute("aria-pressed", String(demoVideo.muted));
    });

    // Progression, minutage et chapitre courant
    let liveIndex = -1;
    demoVideo.addEventListener("timeupdate", () => {
      const { currentTime: t, duration: d } = demoVideo;
      if (d) fill.style.width = `${(t / d) * 100}%`;
      timeEl.textContent = fmt(t);

      let i = starts.length - 1;
      while (i > 0 && t < starts[i]) i--;
      if (i !== liveIndex) {
        chaps.forEach((c, n) => c.classList.toggle("is-live", n === i));
        liveIndex = i;
        // Sur mobile les chapitres forment une bande horizontale :
        // on amène celui en cours au centre, comme un lecteur natif.
        if (isMobile() && chaps[i]) centerInScroller(chaps[i].parentElement, chaps[i]);
      }
    });

    // Cliquer un chapitre : se positionne et lit avec le son.
    // Sur mobile les chapitres sont SOUS le téléphone : sans ce recentrage
    // la lecture démarrerait hors écran — et l'observateur ci-dessous la
    // mettrait aussitôt en pause.
    chaps.forEach((c) => {
      c.addEventListener("click", () => {
        if (isMobile()) {
          phone.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "center",
          });
        }
        seekAndPlay(parseFloat(c.dataset.t));
      });
    });

    // Cliquer la barre de progression
    track.addEventListener("click", (e) => {
      if (!demoVideo.duration) return;
      const r = track.getBoundingClientRect();
      demoVideo.currentTime = ((e.clientX - r.left) / r.width) * demoVideo.duration;
    });

    // Sortie de l'écran : on met simplement en pause (reprise au clic)
    new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting && !demoVideo.paused) demoVideo.pause(); },
      { threshold: 0.2 }
    ).observe(demoVideo);
  }

  /* ── Galerie d'écrans : carrousel aimanté (≤ 720 px) ────
     En dessous de 720 px la grille CSS devient une bande défilante.
     Ici on ajoute la pagination, la mise en avant de l'écran centré
     et la navigation au clic sur les pastilles.                      */
  const screensGrid = document.querySelector(".screens-grid");
  const screensDots = document.getElementById("screensDots");

  if (screensGrid && screensDots) {
    const items = [...screensGrid.querySelectorAll(".screen-item")];

    items.forEach((item, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Écran ${i + 1} sur ${items.length}`);
      dot.addEventListener("click", () => {
        screensGrid.classList.add("is-touched");
        centerInScroller(screensGrid, item);
      });
      screensDots.appendChild(dot);
    });

    const dots = [...screensDots.children];
    let activeIndex = -1;

    const syncCarousel = () => {
      if (!isCarousel()) return;
      const box = screensGrid.getBoundingClientRect();
      const center = box.left + box.width / 2;

      let best = 0;
      let bestDist = Infinity;
      items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });

      if (best === activeIndex) return;
      activeIndex = best;
      items.forEach((el, i) => el.classList.toggle("is-active", i === best));
      dots.forEach((d, i) => {
        d.classList.toggle("is-on", i === best);
        d.setAttribute("aria-selected", String(i === best));
      });
    };

    let carouselRaf = null;
    screensGrid.addEventListener("scroll", () => {
      screensGrid.classList.add("is-touched");
      if (carouselRaf) return;
      carouselRaf = requestAnimationFrame(() => {
        carouselRaf = null;
        syncCarousel();
      });
    }, { passive: true });

    window.addEventListener("resize", syncCarousel, { passive: true });
    syncCarousel();
  }

  /* ── Fond filmé du hero ─────────────────────────────────
     On n'affiche la vidéo qu'une fois la lecture réellement lancée :
     fichier manquant, format refusé, autoplay bloqué, économiseur de
     données — dans tous ces cas la classe n'est jamais posée et le
     décor illustré reste en place. */
  const heroVideo = document.getElementById("heroVideo");
  // La classe va sur la scène, pas sur le hero : le bandeau
  // partenaires est son frère et doit basculer en même temps.
  // Repli sur le hero si le balisage n'a pas encore la scène.
  const heroEl = document.getElementById("heroStage") || document.getElementById("accueil");

  /* 13 Mo pour cinq secondes : hors de question de les imposer à qui
     a activé l'économiseur de données ou navigue en 2G/3G. Ces
     personnes gardent le décor illustré, qui ne coûte rien. */
  const netInfo = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const frugalNetwork = !!netInfo && (
    netInfo.saveData === true ||
    /^(slow-)?2g$/.test(netInfo.effectiveType || "") ||
    netInfo.effectiveType === "3g"
  );

  if (heroVideo && heroEl && !prefersReducedMotion && !frugalNetwork) {
    const showVideo = () => heroEl.classList.add("has-video");

    // L'état actuel d'abord, les événements ensuite. Le script est en
    // « defer » et la vidéo en « preload=auto » : elle est souvent déjà
    // chargée quand on arrive ici, si bien que « loadeddata » ne se
    // redéclenchera jamais. S'en remettre aux seuls événements laissait
    // le fond filmé invisible — et « playing » n'arrive pas non plus
    // quand le navigateur refuse la lecture automatique.
    if (heroVideo.readyState >= 2) showVideo();
    heroVideo.addEventListener("loadeddata", showVideo);
    heroVideo.addEventListener("playing", showVideo);

    const tryPlay = () => {
      const attempt = heroVideo.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
    };
    tryPlay();

    // Lecture automatique bloquée : le premier geste de la personne
    // vaut autorisation, on relance à ce moment-là.
    if (heroVideo.paused) {
      const kick = () => { if (heroVideo.paused) tryPlay(); };
      ["pointerdown", "touchstart", "keydown", "scroll"].forEach((ev) => {
        window.addEventListener(ev, kick, { once: true, passive: true });
      });
    }
  }

  /* ── Téléchargement direct de l'APK ─────────────────────
     Le fichier est servi par le site : un clic programmatique sur un
     lien « download » de même origine l'enregistre sur-le-champ, sans
     la moindre navigation. Tout élément portant data-apk déclenche ce
     téléchargement — le gros bouton APK comme les CTA du hero.      */
  const apkBtn = document.getElementById("apkBtn");
  const APK_URL = apkBtn ? apkBtn.getAttribute("href") : "";

  const startApkDownload = () => {
    if (!APK_URL) return;
    const a = document.createElement("a");
    a.href = APK_URL;
    a.download = "Ecoguide.apk";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  document.querySelectorAll("[data-apk]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const href = el.getAttribute("href") || "";
      const isAnchor = href.startsWith("#") && href.length > 1;

      // Le gros bouton APK pointe déjà sur le fichier : on laisse le
      // navigateur suivre le lien (chemin le plus fiable) et on se
      // contente d'ajouter le retour visuel. Les CTA du hero, eux,
      // pointent sur #telecharger : on déclenche le téléchargement,
      // puis on y amène quand même le visiteur — la section explique
      // comment autoriser l'installation une fois le fichier reçu.
      if (isAnchor) {
        e.preventDefault();
        startApkDownload();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      }

      // Retour visuel : la page ne changeant pas, rien ne signalerait
      // autrement que le téléchargement a bien démarré.
      const label = el.querySelector("[data-apk-label]") || el;
      const original = label.textContent;
      el.classList.add("is-downloading");
      label.textContent = "Téléchargement lancé…";
      setTimeout(() => {
        label.textContent = original;
        el.classList.remove("is-downloading");
      }, 2600);
    });
  });

  /* ── Barre d'action mobile ──────────────────────────────
     Apparaît une fois le hero passé, s'efface à l'approche de la
     section Téléchargement (le bouton y est déjà, en grand).        */
  const mcta = document.getElementById("mcta");
  const downloadSection = document.getElementById("telecharger");
  const demoBlock = document.querySelector(".demo-phone");

  const updateMcta = (scrollY) => {
    if (!mcta || !isMobile()) return;
    const viewH = window.innerHeight;
    const passedHero = scrollY > viewH * 0.6;
    const nearDownload = downloadSection
      ? downloadSection.getBoundingClientRect().top < viewH * 0.85
      : false;

    // La barre de lecture de la démo se cale en bas du téléphone : si
    // elle arrive dans la zone du bouton fixe, on efface le bouton
    // plutôt que de laisser les deux se chevaucher.
    let overPlayer = false;
    if (demoBlock) {
      const r = demoBlock.getBoundingClientRect();
      overPlayer = r.bottom > viewH - 120 && r.top < viewH;
    }

    mcta.classList.toggle("show", passedHero && !nearDownload && !overPlayer);
  };

  /* ── Halo des cartes fonctionnalités ────────────────────
     Le halo radial suit le curseur : on met à jour --mx/--my
     via rAF pour rester fluide.                                    */
  if (finePointer && !prefersReducedMotion) {
    document.querySelectorAll(".feature-card").forEach((card) => {
      let raf = null;
      card.addEventListener("pointermove", (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
          card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        });
      });
    });
  }

  /* ── Révélation au scroll ───────────────────────────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ── Compteurs animés (section stats) ───────────────────── */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1900;
    let start = null;

    const tick = (now) => {
      if (start === null) start = now;
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * easeOutCubic(progress));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  document.querySelectorAll(".counter").forEach((el) => {
    if (prefersReducedMotion) {
      el.textContent = el.dataset.target;
    } else {
      counterObserver.observe(el);
    }
  });

  /* ── Feuilles flottantes dans le hero ───────────────────── */
  const leavesContainer = document.getElementById("leaves");

  if (leavesContainer && !prefersReducedMotion) {
    const LEAF_COLORS = ["#6faf88", "#4e9a6f", "#d9a441", "#94c47d", "#3f7d5c"];
    // Deux fois moins de feuilles sur téléphone : chacune est une couche
    // composée en continu, c'est le poste le plus coûteux du hero.
    const LEAF_COUNT = isMobile() ? 6 : 12;

    for (let i = 0; i < LEAF_COUNT; i++) {
      const leaf = document.createElement("span");
      const size = 11 + Math.random() * 13;
      const duration = 9 + Math.random() * 9;
      const color = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];

      leaf.className = "leaf";
      leaf.style.cssText = [
        `left:${Math.random() * 100}%`,
        `width:${size}px`,
        `height:${size}px`,
        `opacity:${0.45 + Math.random() * 0.4}`,
        `--dur:${duration.toFixed(2)}s`,
        `--delay:${(-Math.random() * duration).toFixed(2)}s`,
        `--sway:${(2.4 + Math.random() * 1.8).toFixed(2)}s`,
      ].join(";");

      leaf.innerHTML =
        `<svg viewBox="0 0 24 24" fill="${color}">` +
        `<path d="M12 2 C18.5 6 20 12.5 12 22 C4 12.5 5.5 6 12 2 Z"/>` +
        `<path d="M12 5 V19" stroke="rgba(255,255,255,.4)" stroke-width="1" fill="none"/>` +
        `</svg>`;

      leavesContainer.appendChild(leaf);
    }
  }

  /* ── Tilt 3D du téléphone du hero ───────────────────────── */
  const heroSection = document.getElementById("accueil");
  const heroPhoneWrap = document.querySelector(".hero-phone");

  // L'animation d'entrée (fill-mode forwards) prend le pas sur le style inline :
  // on retire la classe une fois l'entrée jouée pour libérer le transform du tilt.
  if (heroPhoneWrap) {
    heroPhoneWrap.addEventListener("animationend", () => {
      heroPhoneWrap.classList.remove("anim-up");
    }, { once: true });
  }

  if (heroSection && heroPhoneWrap && finePointer && !prefersReducedMotion) {
    let tiltRaf = null;

    heroSection.addEventListener("mousemove", (e) => {
      if (tiltRaf) return;
      tiltRaf = requestAnimationFrame(() => {
        tiltRaf = null;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        heroPhoneWrap.style.transform =
          `perspective(1300px) rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg)`;
      });
    });

    heroSection.addEventListener("mouseleave", () => {
      heroPhoneWrap.style.transform = "perspective(1300px) rotateY(0deg) rotateX(0deg)";
      heroPhoneWrap.style.transition = "transform .7s cubic-bezier(.22,1,.36,1)";
      setTimeout(() => (heroPhoneWrap.style.transition = ""), 700);
    });
  }

  /* ── Sentier animé (section parcours) ───────────────────── */
  const journeyTrack = document.getElementById("journeyTrack");
  const journeyPath = document.getElementById("journeyPath");
  const journeySteps = document.querySelectorAll(".journey-step");
  const STEP_THRESHOLDS = [0.12, 0.32, 0.52, 0.72, 0.9];
  let pathLength = 1400;

  if (journeyPath) {
    try {
      pathLength = journeyPath.getTotalLength() || 1400;
    } catch (_) { /* longueur de repli */ }
    journeyPath.style.strokeDasharray = pathLength;
    journeyPath.style.strokeDashoffset = pathLength;
  }

  const updateJourney = () => {
    if (!journeyTrack || !journeyPath) return;
    const rect = journeyTrack.getBoundingClientRect();
    const viewH = window.innerHeight;
    const progress = Math.min(Math.max((viewH * 0.8 - rect.top) / rect.height, 0), 1);

    journeyPath.style.strokeDashoffset = pathLength * (1 - progress);

    journeySteps.forEach((step, i) => {
      step.classList.toggle("active", progress >= STEP_THRESHOLDS[i]);
    });
  };

  /* ── Parallaxe des montagnes ────────────────────────────── */
  const mountainLayers = document.querySelectorAll(".mountain-layer");
  const heroHeight = () => (heroSection ? heroSection.offsetHeight : 0);

  const updateParallax = (scrollY) => {
    if (prefersReducedMotion || scrollY > heroHeight()) return;
    mountainLayers.forEach((layer) => {
      const speed = parseFloat(layer.dataset.speed) || 0;
      layer.style.transform = `translate3d(0, ${(scrollY * speed).toFixed(1)}px, 0)`;
    });
  };

  /* ── Boucle scroll unique (nav, barre, parallaxe, sentier) ─ */
  const progressBar = document.getElementById("progressBar");
  let scrollRaf = null;

  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      const scrollY = window.scrollY;

      nav.classList.toggle("scrolled", scrollY > 30);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = `scaleX(${docHeight > 0 ? scrollY / docHeight : 0})`;

      updateParallax(scrollY);
      updateJourney();
      updateMcta(scrollY);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
})();
