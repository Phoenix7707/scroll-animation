// --- 🔹 Always start from top on reload ---
window.scrollTo(0, 0);

// --- 🔹 Register GSAP Plugin ---
gsap.registerPlugin(ScrollTrigger);

// --- 🔹 Lottie files ---
const lottieFiles = [
  "https://raw.githubusercontent.com/Phoenix7707/scroll-animation/refs/heads/main/assets/sceneOne.json",
  "https://raw.githubusercontent.com/Phoenix7707/scroll-animation/refs/heads/main/assets/sceneTwo.json",
  "https://raw.githubusercontent.com/Phoenix7707/scroll-animation/refs/heads/main/assets/sceneThree.json",
  "https://raw.githubusercontent.com/Phoenix7707/scroll-animation/refs/heads/main/assets/sceneFour.json"
];

// --- 🔹 Selectors ---
const loaderPercentage = document.querySelector('.loader-percentage');
const screenLoader = document.querySelector('.screen-loader');
const overlay = document.querySelector('.overlay');

document.body.style.overflow = "hidden"; // prevent scroll during load

let animations = [];
let totalFrames = [];
let loadedCount = 0;
let currentAnimIndex = 0;

// --- 🔹 Smooth percentage update ---
function updatePercentageSmooth(targetPercent) {
  gsap.to(loaderPercentage, {
    innerText: targetPercent,
    duration: 0.5,
    roundProps: "innerText",
    ease: "power1.out"
  });
}

// --- 🔹 Load Lottie animations using Promises ---
async function preloadLotties() {
  const loadPromises = lottieFiles.map((file, i) => {
    return new Promise((resolve) => {
      const container = document.getElementById(`lottie-container-${i + 1}`);
      const anim = lottie.loadAnimation({
        container,
        renderer: "svg",
        loop: false,
        autoplay: false,
        rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
        path: file
      });

      animations[i] = anim;

      // Resolve when DOM is fully loaded for this Lottie
      anim.addEventListener("DOMLoaded", () => {
        totalFrames[i] = anim.totalFrames;
        loadedCount++;
        updatePercentageSmooth((loadedCount / lottieFiles.length) * 100);
        resolve(true);
      });
    });
  });

  await Promise.all(loadPromises);
  hideLoader();
}


// 🚀 Start loading
preloadLotties();

// --- 🔹 Hide loader & fade overlay ---
function hideLoader() {
  gsap.to(screenLoader, {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      screenLoader.style.pointerEvents = "none";
      screenLoader.remove();
      fadeOverlay();
    }
  });
}

function fadeOverlay() {
  setTimeout(() => {
    gsap.to(overlay, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        overlay.style.display = "none";
        document.body.style.overflow = "auto";
        initScrollAnimation();
      }
    });
  }, 1000);
}

// --- 🔹 Switch between animations ---
function switchToAnimation(index) {
  if (currentAnimIndex === index) return;
  currentAnimIndex = index;

  animations.forEach((anim, i) => {
    document.getElementById(`lottie-container-${i + 1}`)
      .classList.toggle('hidden', i !== index);
  });
}

// --- 🔹 Show/Hide text based on frame range ---
function handleTextVisibility(animIndex, currentFrame) {
  document.querySelectorAll(`.scroll-appearence[data-anim="${animIndex + 1}"]`).forEach(text => {
    const start = parseFloat(text.dataset.start);
    const end = parseFloat(text.dataset.end);

    if (currentFrame >= start && currentFrame <= end) {
      gsap.to(text, { opacity: 1, pointerEvents: 'auto' });
      text.dataset.visible = "true";
    } else {
      gsap.to(text, { opacity: 0, pointerEvents: 'none' });
      text.dataset.visible = "false";
    }
  });
}

// --- 🔹 Scroll-controlled Lottie ---
function initScrollAnimation() {
  const total = totalFrames.reduce((a, b) => a + b, 0);
  let obj = { frame: 0 };

  gsap.to(obj, {
    frame: total - 1,
    snap: "frame",
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      invalidateOnRefresh: true
    },
    onUpdate: () => {
      let currentFrame = Math.floor(obj.frame);
      let frameSum = 0;

      for (let i = 0; i < animations.length; i++) {
        if (currentFrame < frameSum + totalFrames[i]) {
          switchToAnimation(i);
          const localFrame = currentFrame - frameSum;
          animations[i].goToAndStop(localFrame, true);
          handleTextVisibility(i, localFrame);
          break;
        }
        frameSum += totalFrames[i];
      }
    }
  });
}

// --- 🔹 Custom scrollbar logic ---
const track = document.querySelector('.scrollbar-track');
const thumb = document.querySelector('.scrollbar-thumb');
let isDragging = false, startY, startScrollTop;

function updateThumb() {
  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = window.innerHeight;

  const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 25);
  const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight);

  thumb.style.height = `${thumbHeight}px`;
  thumb.style.top = `${thumbTop}px`;
}

function startDrag(y) {
  isDragging = true;
  startY = y;
  startScrollTop = window.scrollY;
  document.body.style.userSelect = 'none';
}
function doDrag(y) {
  if (!isDragging) return;
  const deltaY = y - startY;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = window.innerHeight;
  const scrollRatio = (scrollHeight - clientHeight) / (clientHeight - thumb.offsetHeight);
  window.scrollTo(0, startScrollTop + deltaY * scrollRatio);
}
function stopDrag() {
  isDragging = false;
  document.body.style.userSelect = '';
  updateThumb();
}

// --- 🔹 Mouse + touch events ---
thumb.addEventListener('mousedown', e => startDrag(e.clientY));
window.addEventListener('mousemove', e => doDrag(e.clientY));
window.addEventListener('mouseup', stopDrag);
thumb.addEventListener('touchstart', e => startDrag(e.touches[0].clientY));
window.addEventListener('touchmove', e => doDrag(e.touches[0].clientY));
window.addEventListener('touchend', stopDrag);

window.addEventListener('scroll', updateThumb);
window.addEventListener('load', updateThumb);

// --- 🔹 Scroll hint fade-out ---
gsap.to(".scroll-hint", {
  scale: 0,
  opacity: 0,
  ease: "power2.out",
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: "100",
    scrub: 1
  }
});

// --- 🔹 Refresh & reset on resize/load ---
window.addEventListener('resize', () => {
  ScrollTrigger.refresh();
  updateThumb();
});

window.addEventListener('load', () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
    updateThumb();
  }, 50);
});

// --- 🔹 Projects Showcase ---
const projectImages = [
  {
    mobile: "assets/dilkarishtaMobile.jpg",
    desktop: "assets/dilkarishtaDesktop.jpg"
  },
  {
    mobile: "assets/buttlerMobile.jpg",
    desktop: "assets/buttlerDesktop.jpg"
  },
  {
    mobile: "assets/hukdatingMobile.jpg",
    desktop: "assets/hukdatingDesktop.jpg"
  },
  {
    mobile: "assets/fyferMobile.jpg",
    desktop: "assets/fyferDesktop.jpg"
  },
  {
    mobile: "assets/milkarMobile.jpg",
    desktop: "assets/milkarDesktop.jpg"
  }
];
const wrapper = document.querySelector(".myProjectsSwiper .swiper-wrapper");

projectImages.forEach(img => {
  const slide = `
    <div class="swiper-slide">
      <picture>
        <source media="(max-width: 768px)" srcset="${img.mobile}">
        <source media="(min-width: 769px)" srcset="${img.desktop}">
        <img src="${img.desktop}">
      </picture>
    </div>
  `;
  wrapper.insertAdjacentHTML("beforeend", slide);
});


new Swiper('.myProjectsSwiper', {
  loop: true,
  slidesPerView: 1,
  centeredSlides: true,
  spaceBetween: 0,
  navigation: {
    prevEl: '.myProjectsSwiper .swiper-button-prev',
    nextEl: '.myProjectsSwiper .swiper-button-next',
    },
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
});

const projectsPreview = document.querySelector('.projects-preview');

const tl = gsap.timeline({ paused: true });

tl.fromTo(projectsPreview,
  { y: "100%", scale: 0.5, opacity: 0 },
  { y: "0%", scale: 1, opacity: 1, ease: "none", duration: 1 }
)
tl.to(projectsPreview,
  { y: "0%", scale: 1, opacity: 1, ease: "none" }
);
tl.to(projectsPreview,
  { y: "-100%", scale: 0.5, opacity: 0, ease: "none", duration: 1 }
);

function updateProjectsPreview() {
  const total = totalFrames.reduce((a, b) => a + b, 0);
  const currentFrame = Math.floor((window.scrollY / ScrollTrigger.maxScroll(window)) * total);

  const start = 8200;
  const end = 11700;
  console.log(total, currentFrame, start, end);
  console.log(currentFrame < start);
  console.log(currentFrame > end);

  if (currentFrame <= start) {
    tl.progress(0);
    return;
  }

  if (currentFrame >= end) {
    tl.progress(1);
    return;
  }

  const progress = (currentFrame - start) / (end - start);

  tl.progress(progress);
  console.log(progress);
}

window.addEventListener('scroll', updateProjectsPreview);
updateProjectsPreview();

// --- 🔹 Feedback Slider ---
const feedbacks = [
  {
    name: "Cedric",
    text: "Junaid is very professional. He is timely with meetings and deliverables. He asks questions to fully understand the scope of what the client is looking for. We could not be happier with him and his team and look forward to working with him in the future."
  },
  {
    name: "Nandor Nagy",
    text: "Junaid delivered outstanding work on our project. He was efficient, detail-oriented, and went above and beyond the initial requirements. The quality of his work and his quick delivery time were impressive. I look forward to hiring him again."
  },
  {
    name: "Ikenna Mbah",
    text: "It was really a pleasure working with Junaid. His communication and delivery were excellent."
  },
  {
    name: "Cedric",
    text: "Junaid is very professional. He is timely with meetings and deliverables. He asks questions to fully understand the scope of what the client is looking for. We could not be happier with him and his team and look forward to working with him in the future."
  },
  {
    name: "Khawaja Mohsin",
    text: "Absolutely thrilled with the service provided by Junaid! He built my website incredibly quickly and nailed every detail I asked for. His speed and precision were impressive, and the result exceeded my expectations. I couldn't be happier with the outcome. Would highly recommend his services to anyone in need of a skilled developer who gets the job done right, and fast!"
  }
];

const swiperWrapper = document.querySelector('.myTestinomialsSwiper .swiper-wrapper');

feedbacks.forEach(feedback => {
  const slide = document.createElement('div');
  slide.classList.add('swiper-slide');

  slide.innerHTML = `
    <div class="feedback-content">
      <strong class="feedback-name">${feedback.name}</strong>
      <span class="feedback-text">${feedback.text}</span>
    </div>
  `;

  swiperWrapper.appendChild(slide);
});

const swiper = new Swiper('.myTestinomialsSwiper', {
  loop: true,
  slidesPerView: 3,
  spaceBetween: 20,
  centeredSlides: true,
  navigation: {
  prevEl: '.myTestinomialsSwiper .swiper-button-prev',
  nextEl: '.myTestinomialsSwiper .swiper-button-next',
  },
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
  breakpoints: {
  0: { slidesPerView: 1 },
  768: { slidesPerView: 3 }
}
});

// --- 🔹 Navbar ---
const menuIcon = document.getElementById("menu-icon");
const navLinks = document.getElementById("nav-links");
let clickedFrame = null;

menuIcon.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

// ---- 🔹 Navbar Frame Jump and Changing the URL ----
gsap.registerPlugin(ScrollToPlugin);
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", function(e) {
    e.preventDefault();

    const targetId = this.getAttribute("href").substring(1);
    const targetDiv = document.getElementById(targetId);

    if (!targetDiv) return;

    const animIndex = Number(targetDiv.dataset.anim) - 1;
    const localStart = Number(targetDiv.dataset.start);

    let globalFrame = 0;
    for (let i = 0; i < animIndex; i++) {
      globalFrame += totalFrames[i];
    }
    globalFrame += localStart;
    clickedFrame = globalFrame;

    const total = totalFrames.reduce((a, b) => a + b, 0);
    if (!total || isNaN(globalFrame)) return;

    const scrollTarget =
      (globalFrame / total) * ScrollTrigger.maxScroll(window);

    gsap.to(window, {
      scrollTo: {
        y: scrollTarget,
        autoKill: false
      },
      duration: 1.2,
      ease: "power2.out",
      onComplete: () => {
        history.replaceState(null, null, `#${targetId}`);
        setActiveLink(targetId);
      }
    });

    navLinks.classList.remove("open");
  });
});
// ---- 🔹 Active/Inactive the Navbar Links ---
function setActiveLink(targetId) {
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === `#${targetId}`) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}
window.addEventListener('scroll', () => {
  const total = totalFrames.reduce((a, b) => a + b, 0);
  const currentFrame = Math.floor((window.scrollY / ScrollTrigger.maxScroll(window)) * total);
  const scrollThreshold = clickedFrame + 500;

  if (currentFrame > scrollThreshold) {
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  }
});