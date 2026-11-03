// Telefon menyusi
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');

menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
});

// Menyudagi havola bosilganda menyuni yopish
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Menyuni ochish');
  });
});

// Scroll paytida elementlarni ko'rsatish
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Faol bo'limni menyuda belgilash
const navLinks = document.querySelectorAll('.nav > a[href^="#"]');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('section[id], footer[id]').forEach(s => sectionObserver.observe(s));

// Joriy yil
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Google orqali kirish ----------
// Google Cloud Console'dan olingan OAuth Client ID ni shu yerga qo'ying
const GOOGLE_CLIENT_ID = '718318152423-qicrj78q4g8mqhbv02rl0b6mbtjitvco.apps.googleusercontent.com';
const USER_KEY = 'nova_user';

const loginDialog = document.getElementById('loginDialog');
const loginNote = document.getElementById('loginNote');
const guestActions = document.getElementById('guestActions');
const userBox = document.getElementById('userBox');
let googleReady = false;

function closeMenu() {
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Menyuni ochish');
}

function openLogin() {
  closeMenu();
  initGoogle();
  loginDialog.showModal();
}

document.querySelectorAll('[data-open-login]').forEach(btn => btn.addEventListener('click', openLogin));
document.getElementById('loginClose').addEventListener('click', () => loginDialog.close());
// Fonni bosganda oynani yopish
loginDialog.addEventListener('click', e => {
  if (e.target === loginDialog) loginDialog.close();
});

// Google qaytargan JWT tokendan ism, email va rasmni o'qish
function decodeJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
  return JSON.parse(json);
}

function handleCredential(response) {
  const data = decodeJwt(response.credential);
  const user = { name: data.name, email: data.email, picture: data.picture };
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) {}
  renderUser(user);
  loginDialog.close();
}

function renderUser(user) {
  document.body.classList.toggle('locked', !user);
  guestActions.hidden = !!user;
  userBox.hidden = !user;
  if (!user) return;
  ['userAvatar', 'userMenuAvatar'].forEach(id => {
    const avatar = document.getElementById(id);
    if (user.picture) avatar.src = user.picture;
    else avatar.removeAttribute('src');
  });
  // Ism va email faqat rasm bosilganda ochiladigan menyuda ko'rinadi
  document.getElementById('userName').textContent = user.name || '';
  document.getElementById('userEmail').textContent = user.email || '';
}

// Rasm bosilganda "Chiqish" menyusini ochish
const userBtn = document.getElementById('userBtn');
const userMenu = document.getElementById('userMenu');

function toggleUserMenu(open) {
  userMenu.hidden = !open;
  userBtn.setAttribute('aria-expanded', open);
}

userBtn.addEventListener('click', e => {
  e.stopPropagation();
  toggleUserMenu(userMenu.hidden);
});
document.addEventListener('click', e => {
  if (!userBox.contains(e.target)) toggleUserMenu(false);
});

function showNote(html) {
  loginNote.innerHTML = html;
  loginNote.hidden = false;
}

function initGoogle() {
  if (googleReady) return;
  if (GOOGLE_CLIENT_ID.startsWith('YOUR_CLIENT_ID')) {
    showNote('Google kirishi hali sozlanmagan. <code>script.js</code> faylidagi <code>GOOGLE_CLIENT_ID</code> ga Google Cloud Console\'dan olingan Client ID ni yozing.');
    return;
  }
  if (location.protocol === 'file:') {
    showNote('Sayt fayl sifatida ochilgan — Google bunga ruxsat bermaydi. Saytni server orqali oching: <code>http://localhost:5500</code>');
    return;
  }
  if (!window.google || !google.accounts) {
    showNote('Google yuklanmoqda...');
    setTimeout(initGoogle, 300);
    return;
  }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredential,
  });
  google.accounts.id.renderButton(document.getElementById('googleBtn'), {
    theme: 'filled_black',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
    width: 300,
    locale: 'uz',
  });
  loginNote.hidden = true;
  googleReady = true;
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  try { localStorage.removeItem(USER_KEY); } catch (e) {}
  if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
  toggleUserMenu(false);
  renderUser(null);
  openLogin();
});

// Avval kirgan foydalanuvchini eslab qolish, aks holda darhol akkaunt so'rash
let savedUser = null;
try { savedUser = JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) {}
renderUser(savedUser);
if (!savedUser) openLogin();
