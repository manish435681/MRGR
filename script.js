// script.js
document.addEventListener('DOMContentLoaded', () => {
    let slides = document.querySelectorAll('.slide');
    let totalSlides = slides.length;
    let currentIdx = 0;
  
    const counterEl = document.getElementById('counter');
    const railToc = document.getElementById('rail-toc');
    const progressBar = document.getElementById('progressBar');
    const menuToggle = document.getElementById('menu-toggle');
    const deck = document.getElementById('deck');
    const coverSlides = [];
    const setSidebarOpen = (isOpen) => {
      document.body.classList.toggle('rail-open', isOpen);
      menuToggle?.setAttribute('aria-expanded', String(isOpen));
    };
  
    // ==========================================
    // 1. Interactive Startup Prompt / Filter Logic
    // ==========================================
    const overlay = document.getElementById('mod-prompt-overlay');
    const inputField = document.getElementById('mod-input-field');
    const loadBtn = document.getElementById('mod-load-btn');
    const loadAllBtn = document.getElementById('mod-load-all-btn');

    function initializeLectureFilter(filterText) {
        if (filterText && filterText.trim() !== "") {
            const requestedIds = filterText.split(',').map(n => n.trim().padStart(2, '0'));
            let currentTopicTag = "";
            
            slides.forEach((slide) => {
                const sidebarTitle = slide.getAttribute('data-sidebar');
                const isThankYouSlide = (sidebarTitle === 'End of Slides');

                // Extract number from titles like "CH-05" 
                if (sidebarTitle && !isThankYouSlide) {
                    const match = sidebarTitle.match(/(?:CH|SC)-(\d+)/i) || sidebarTitle.match(/\d+/);
                    if (match) {
                        currentTopicTag = (match[1] || match[0]).padStart(2, '0');
                    }
                }
                
                // Remove the slide ONLY if it's unrequested AND not the Thank You slide
                if (!requestedIds.includes(currentTopicTag) && !isThankYouSlide) {
                    slide.remove(); 
                }
            });

            // Re-calculate the remaining slides
            slides = document.querySelectorAll('.slide');
            totalSlides = slides.length;
            currentIdx = 0;

            // Rebuild UI
            buildSidebar();
            slides.forEach(s => s.classList.remove('active'));
            if (slides.length > 0) slides[0].classList.add('active');
            updateUI();
        }
        
        if (overlay) overlay.style.display = 'none';
    }

    if (loadBtn) loadBtn.addEventListener('click', () => initializeLectureFilter(inputField.value));
    if (loadAllBtn) loadAllBtn.addEventListener('click', () => { if (overlay) overlay.style.display = 'none'; });
    if (inputField) inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') initializeLectureFilter(inputField.value); });


    // ==========================================
    // 2. Sidebar Generator (Only shows covers)
    // ==========================================
    function buildSidebar() {
      if (!railToc) return;
      railToc.innerHTML = '';
      coverSlides.length = 0;
  
      slides.forEach((slide, index) => {
        const title = slide.getAttribute('data-sidebar');
        if (title) { // Since sub-slides don't have data-sidebar, they won't make a button!
          coverSlides.push({ index, title });
          const btn = document.createElement('button');
          btn.className = 'rail-item';
          btn.dataset.targetIndex = index;
          btn.innerHTML = `<span class="label">${title}</span>`;
          btn.addEventListener('click', () => {
            changeSlide(index);
            if (window.innerWidth <= 860) setSidebarOpen(false);
          });
          railToc.appendChild(btn);
        }
      });
    }
  
    // ==========================================
    // 3. Slide Navigation Logic
    // ==========================================
    function updateUI() {
      if (counterEl) {
        const cur = String(currentIdx + 1).padStart(2, '0');
        const tot = String(totalSlides).padStart(2, '0');
        counterEl.textContent = `${cur}/${tot} slides`;
      }
      if (progressBar) {
        progressBar.style.width = `${((currentIdx + 1) / totalSlides) * 100}%`;
      }
  
      let activeCoverIndex = coverSlides[0]?.index ?? 0;
      for (let i = 0; i < coverSlides.length; i++) {
        if (currentIdx >= coverSlides[i].index) activeCoverIndex = coverSlides[i].index;
      }
  
      document.querySelectorAll('.rail-item').forEach(item => {
        item.classList.toggle('current', parseInt(item.dataset.targetIndex) === activeCoverIndex);
      });
    }
  
    function changeSlide(targetIndex) {
      if (targetIndex < 0 || targetIndex >= totalSlides) return;
      slides[currentIdx]?.classList.remove('active');
      currentIdx = targetIndex;
      slides[currentIdx]?.classList.add('active');
      
      // Reset scroll position for the new slide
      const frame = slides[currentIdx].querySelector('.scrollable-frame');
      if (frame) frame.scrollTop = 0;
      
      updateUI();
    }
  
    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const nextKeys = ['ArrowRight', 'ArrowDown', ' ', 'PageDown'];
      const prevKeys = ['ArrowLeft', 'ArrowUp', 'PageUp'];
  
      if (nextKeys.includes(e.key)) {
        e.preventDefault();
        changeSlide(currentIdx + 1);
      } else if (prevKeys.includes(e.key)) {
        e.preventDefault();
        changeSlide(currentIdx - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        changeSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        changeSlide(totalSlides - 1);
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setSidebarOpen(!document.body.classList.contains('rail-open'));
      }
    });
  
    // Edge Clicking (10% Margins)
    deck?.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG' || e.target.closest('button, a, .rail-item, input')) return;
      const clickX = e.clientX;
      const width = window.innerWidth;
      if (clickX < width * 0.10) changeSlide(currentIdx - 1);
      else if (clickX > width * 0.90) changeSlide(currentIdx + 1);
    });
  
    // Touch Gestures with Vertical Scroll Protection
    let touchX = 0, touchY = 0;
    deck?.addEventListener('touchstart', (e) => {
      touchX = e.changedTouches[0].screenX;
      touchY = e.changedTouches[0].screenY;
    }, { passive: true });
  
    deck?.addEventListener('touchend', (e) => {
      const dX = e.changedTouches[0].screenX - touchX;
      const dY = e.changedTouches[0].screenY - touchY;
      if (Math.abs(dX) >= 50 && Math.abs(dY) <= 35) {
        dX < 0 ? changeSlide(currentIdx + 1) : changeSlide(currentIdx - 1);
      }
    });
  
    // ==========================================
    // 4. Lightbox Image Viewer
    // ==========================================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightbox = () => {
      if (!lightbox) return;
      lightbox.classList.remove('active');
      setTimeout(() => {
        lightbox.style.display = 'none';
        if (lightboxImg) lightboxImg.src = '';
      }, 250);
    };
  
    document.querySelectorAll('.switch-img img, .switch-img-landscape img, .zoomable-img').forEach(img => {
      img.addEventListener('click', () => {
        if (!lightbox || !lightboxImg) return;
        lightbox.style.display = 'flex';
        setTimeout(() => lightbox.classList.add('active'), 10);
        lightboxImg.src = img.src;
      });
    });
  
    lightbox?.addEventListener('click', (e) => {
      if (e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')) {
        closeLightbox();
      }
    });
  
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox?.classList.contains('active')) closeLightbox();
    });
  
    // Cursor Halo
    const halo = document.getElementById('cursor-halo');
    if (halo) {
      document.addEventListener('mousemove', (e) => {
        halo.style.setProperty('--mouse-x', `${e.clientX}px`);
        halo.style.setProperty('--mouse-y', `${e.clientY}px`);
      });
    }
  
    // Mobile Sidebar Toggle
    menuToggle?.addEventListener('click', () => {
      setSidebarOpen(!document.body.classList.contains('rail-open'));
    });
  
    // Initialize Presentation
    buildSidebar();
    if (slides.length > 0) changeSlide(0);

    // ==========================================
    // 5. Train Animation Logic 
    // ==========================================
    const train = document.getElementById('train');
    const track = document.querySelector('.track-container');

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    function dispatchNextTrain() {
        if (!train || !track) return;

        const isForward = Math.random() > 0.5;
        const tripDuration = getRandom(5000, 9000);
        const trackWidth = track.clientWidth;
        const startPos = isForward ? -500 : trackWidth + 50;
        const endPos = isForward ? trackWidth + 50 : -500;

        train.style.transition = 'none';
        train.style.left = startPos + 'px';
        train.style.transform = isForward ? 'scaleX(1)' : 'scaleX(-1)';

        train.getBoundingClientRect();

        train.style.transition = `left ${tripDuration}ms linear`;
        train.style.left = endPos + 'px';

        const randomDelay = getRandom(1000, 4000);
        setTimeout(dispatchNextTrain, tripDuration + randomDelay);
    }

    setTimeout(dispatchNextTrain, 1000);
});