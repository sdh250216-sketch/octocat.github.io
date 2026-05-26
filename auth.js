/**
 * auth.js — 공통 인증 모듈
 * localStorage: pf-users, pf-posts, pf-next-id
 * sessionStorage: pf-session (로그인 세션)
 */

const Auth = (() => {
  // ── 스토리지 키 ──
  const KEY_USERS   = 'pf-users';
  const KEY_SESSION = 'pf-session';

  // ── 사용자 목록 로드 ──
  function getUsers() {
    return JSON.parse(localStorage.getItem(KEY_USERS) || '[]');
  }

  function setUsers(users) {
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
  }

  // ── 현재 로그인 세션 ──
  function getSession() {
    try {
      const raw = sessionStorage.getItem(KEY_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function setSession(user) {
    sessionStorage.setItem(KEY_SESSION, JSON.stringify(user));
  }

  function clearSession() {
    sessionStorage.removeItem(KEY_SESSION);
  }

  // ── 로그인 여부 ──
  function isLoggedIn() {
    const s = getSession();
    if (!s) return false;
    // 세션이 실제 유저와 일치하는지 확인
    const users = getUsers();
    return users.some(u => u.id === s.id);
  }

  // ── 현재 유저 객체 { id, nickname } ──
  function currentUser() {
    if (!isLoggedIn()) return null;
    return getSession();
  }

  // ── 회원가입 ──
  // 반환값: { ok: true } | { ok: false, msg: '...' }
  function register(id, pw, pw2, nickname) {
    if (!/^[a-zA-Z0-9]{4,16}$/.test(id))
      return { ok: false, msg: '아이디: 영문+숫자 4~16자로 입력해주세요.' };
    if (pw.length < 4)
      return { ok: false, msg: '비밀번호는 4자 이상이어야 합니다.' };
    if (pw !== pw2)
      return { ok: false, msg: '비밀번호가 일치하지 않습니다.' };
    if (!nickname.trim())
      return { ok: false, msg: '닉네임을 입력해주세요.' };

    const users = getUsers();
    if (users.find(u => u.id === id))
      return { ok: false, msg: '이미 사용 중인 아이디입니다.' };

    users.push({ id, pw, nickname: nickname.trim() });
    setUsers(users);

    // 가입 후 자동 로그인
    setSession({ id, nickname: nickname.trim() });
    return { ok: true };
  }

  // ── 로그인 ──
  function login(id, pw) {
    const users = getUsers();
    const u = users.find(u => u.id === id && u.pw === pw);
    if (!u) return { ok: false, msg: '아이디 또는 비밀번호가 올바르지 않습니다.' };

    setSession({ id: u.id, nickname: u.nickname });
    return { ok: true };
  }

  // ── 로그아웃 ──
  function logout() {
    clearSession();
  }

  // ── 로그인 필요 시 login.html로 리다이렉트 ──
  function requireAuth() {
    if (!isLoggedIn()) {
      location.href = 'login.html';
    }
  }

  // ── 이미 로그인 시 index.html로 ──
  function redirectIfLoggedIn() {
    if (isLoggedIn()) {
      location.href = 'index.html';
    }
  }

  return {
    getUsers, setUsers,
    getSession, isLoggedIn, currentUser,
    register, login, logout,
    requireAuth, redirectIfLoggedIn,
  };
})();


/**
 * Board — 게시글 CRUD 모듈
 */
const Board = (() => {
  const KEY_POSTS   = 'pf-posts';
  const KEY_NEXT_ID = 'pf-next-id';

  function getPosts() {
    return JSON.parse(localStorage.getItem(KEY_POSTS) || '[]');
  }

  function setPosts(posts) {
    localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
  }

  function getNextId() {
    return parseInt(localStorage.getItem(KEY_NEXT_ID) || '1');
  }

  function setNextId(id) {
    localStorage.setItem(KEY_NEXT_ID, String(id));
  }

  function add(title, content) {
    const user = Auth.currentUser();
    if (!user) return null;
    const posts = getPosts();
    const id = getNextId();
    const post = {
      id,
      title,
      content,
      authorId:   user.id,
      authorNick: user.nickname,
      date: new Date().toISOString(),
    };
    posts.push(post);
    setPosts(posts);
    setNextId(id + 1);
    return post;
  }

  function update(id, title, content) {
    const user = Auth.currentUser();
    if (!user) return false;
    const posts = getPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    if (posts[idx].authorId !== user.id) return false;
    posts[idx] = { ...posts[idx], title, content };
    setPosts(posts);
    return true;
  }

  function remove(id) {
    const user = Auth.currentUser();
    if (!user) return false;
    let posts = getPosts();
    const post = posts.find(p => p.id === id);
    if (!post || post.authorId !== user.id) return false;
    posts = posts.filter(p => p.id !== id);
    setPosts(posts);
    return true;
  }

  function getById(id) {
    return getPosts().find(p => p.id === id) || null;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  return { getPosts, add, update, remove, getById, formatDate, escHtml };
})();
