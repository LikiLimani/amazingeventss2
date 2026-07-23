/* =========================================================
   AmazingEventss — site.js
   Handles: sticky nav, mobile menu, reveal-on-scroll,
   gallery filtering, multi-step contact form, sticky mobile CTA
   ========================================================= */

/* =========================================================
   CMS-driven content
   All data below is edited through the /admin panel (Decap CMS)
   and lives in /data/*.json — nothing here should need manual
   code changes once the CMS is set up.
   ========================================================= */

function loadSiteSettings() {
  fetch('data/site-settings.json')
    .then(function (r) { return r.json(); })
    .then(function (s) {
      document.querySelectorAll('[data-site="phone-text"]').forEach(function (el) { el.textContent = s.phone; });
      document.querySelectorAll('[data-site="phone-link"]').forEach(function (el) { el.setAttribute('href', 'tel:' + s.phone_link); });
      document.querySelectorAll('[data-site="email-text"]').forEach(function (el) { el.textContent = s.email; });
      document.querySelectorAll('[data-site="email-link"]').forEach(function (el) { el.setAttribute('href', 'mailto:' + s.email); });
      document.querySelectorAll('[data-site="instagram-link"]').forEach(function (el) { el.setAttribute('href', s.instagram_url); });
      document.querySelectorAll('[data-site="pinterest-link"]').forEach(function (el) { el.setAttribute('href', s.pinterest_url); });

      var heroEyebrow = document.getElementById('heroEyebrow');
      if (heroEyebrow && s.hero_eyebrow) heroEyebrow.textContent = s.hero_eyebrow;

      var heroMain = document.getElementById('heroHeadlineMain');
      var heroEm = document.getElementById('heroHeadlineEmphasis');
      if (heroMain && s.hero_headline_main) heroMain.textContent = s.hero_headline_main + ' ';
      if (heroEm && s.hero_headline_emphasis) heroEm.textContent = s.hero_headline_emphasis;

      var heroSub = document.getElementById('heroSubheadline');
      if (heroSub && s.hero_subheadline) heroSub.textContent = s.hero_subheadline;

      var statWeddings = document.getElementById('statWeddings');
      if (statWeddings && s.stat_weddings) statWeddings.textContent = s.stat_weddings;
      var statVenues = document.getElementById('statVenues');
      if (statVenues && s.stat_venues) statVenues.textContent = s.stat_venues;

      var venueWrap = document.getElementById('venuePartners');
      if (venueWrap && s.venue_partners && s.venue_partners.length) {
        venueWrap.innerHTML = s.venue_partners.map(function (v) {
          return '<span>' + v + '</span>';
        }).join('');
      }
    })
    .catch(function (err) { console.warn('Site settings failed to load, using page defaults.', err); });
}

function loadTestimonials() {
  var wrap = document.getElementById('testimonialsRow');
  if (!wrap) return;
  fetch('data/testimonials.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var list = data && data.items;
      if (!list || !list.length) return;
      wrap.innerHTML = list.map(function (t) {
        return '' +
          '<div class="col-md-4 reveal is-visible">' +
            '<div class="testi-card">' +
              '<p class="quote">"' + t.quote + '"</p>' +
              '<div class="testi-name">' + t.name + '</div>' +
              '<div class="testi-role">' + t.role + '</div>' +
            '</div>' +
          '</div>';
      }).join('');
    })
    .catch(function (err) { console.warn('Testimonials failed to load, using page defaults.', err); });
}

function loadGallery() {
  var wrap = document.getElementById('galleryGrid');
  if (!wrap) return;
  fetch('data/gallery.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var list = data && data.items;
      if (!list || !list.length) return;
      wrap.innerHTML = list.map(function (item) {
        var bg = item.image ? ' style="background-image:url(\'' + item.image + '\'); background-size:cover; background-position:center;"' : '';
        return '' +
          '<div class="gallery-item reveal is-visible" data-cat="' + item.category + '">' +
            '<div class="media-frame square"' + bg + '>' +
              '<span class="media-tag">' + item.tag + '</span>' +
              '<div class="media-caption">' + item.caption + '</div>' +
            '</div>' +
          '</div>';
      }).join('');
      attachGalleryFilters();
    })
    .catch(function (err) { console.warn('Gallery failed to load, using page defaults.', err); });
}

/* Re-runs the filter-button wiring after gallery items are injected dynamically */
function attachGalleryFilters() {
  var filterBtns = document.querySelectorAll('.filter-btn');
  var galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');
      galleryItems.forEach(function (item) {
        var cats = (item.getAttribute('data-cat') || '').split(' ');
        if (filter === 'all' || cats.indexOf(filter) !== -1) {
          item.classList.remove('is-hidden');
        } else {
          item.classList.add('is-hidden');
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {

  loadSiteSettings();
  loadTestimonials();
  loadGallery();

  /* ---------- Sticky / solid navbar on scroll ---------- */
  var nav = document.querySelector('.ae-nav');
  function handleNavScroll() {
    if (!nav) return;
    if (window.scrollY > 40) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }
  handleNavScroll();
  window.addEventListener('scroll', handleNavScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  var burger = document.querySelector('.ae-burger');
  var links = document.querySelector('.ae-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      links.classList.toggle('is-open');
      var expanded = links.classList.contains('is-open');
      burger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('is-open'); });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Sticky mobile CTA (hide near footer / at top) ---------- */
  var stickyCta = document.querySelector('.sticky-cta');
  if (stickyCta) {
    function toggleSticky() {
      if (window.scrollY > 500) {
        stickyCta.classList.add('is-visible');
      } else {
        stickyCta.classList.remove('is-visible');
      }
    }
    toggleSticky();
    window.addEventListener('scroll', toggleSticky, { passive: true });
  }

  /* ---------- Multi-step contact form ---------- */
  var form = document.getElementById('quoteForm');
  if (form) {
    var steps = form.querySelectorAll('.form-step');
    var trackerItems = document.querySelectorAll('.step-tracker div');
    var nextBtns = form.querySelectorAll('[data-next]');
    var prevBtns = form.querySelectorAll('[data-prev]');
    var successMsg = document.querySelector('.success-msg');
    var currentStep = 0;

    function showStep(index) {
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
      trackerItems.forEach(function (t, i) { t.classList.toggle('active', i <= index); });
      currentStep = index;
    }

    function validateStep(stepEl) {
      var required = stepEl.querySelectorAll('[required]');
      var valid = true;
      required.forEach(function (field) {
        if (!field.value || (field.type === 'checkbox' && !field.checked)) {
          valid = false;
        }
      });
      return valid;
    }

    nextBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var activeStep = steps[currentStep];
        if (!validateStep(activeStep)) {
          activeStep.querySelectorAll('[required]').forEach(function (f) {
            if (!f.value) f.style.borderColor = '#c0392b';
          });
          return;
        }
        if (currentStep < steps.length - 1) showStep(currentStep + 1);
      });
    });

    prevBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (currentStep > 0) showStep(currentStep - 1);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var showSuccess = function () {
        form.style.display = 'none';
        document.querySelector('.step-tracker').style.display = 'none';
        if (successMsg) successMsg.classList.add('is-active');
      };

      /* Submit to Netlify Forms (works once this site is deployed on Netlify
         with the hidden static form below detected at build time).
         Falls back to showing success locally if the network request fails,
         e.g. when testing on your own machine before deploying. */
      var data = new FormData(form);
      var encoded = [];
      for (var pair of data.entries()) {
        encoded.push(encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]));
      }
      encoded.push('form-name=quote-request');

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encoded.join('&')
      })
      .then(showSuccess)
      .catch(showSuccess);
    });

    showStep(0);
  }

});
