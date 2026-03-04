/**
 * #Meridian計画 プロジェクトサイト
 * Markdownファイルを読み込み、HTMLに変換して表示
 */

(function () {
  'use strict';

  // Markdownファイルのパス（GitHub Pagesでは相対パスで取得）
  const MD_HOME = 'md/home.md';
  const MD_PROJECT = 'md/project.md';
  const MD_DEVELOPMENT = 'md/development.md';
  const MD_MEMBERS = 'md/members.md';
  const MD_NEWS = 'md/news.md';
  const MD_LINKS = 'md/links.md';
  const MD_DOCS = 'md/docs.md';

  // セクションとコンテンツのマッピング
  const sections = {
    home: { element: document.getElementById('home-content'), file: MD_HOME },
    project: { element: document.getElementById('project-content'), file: MD_PROJECT },
    development: { element: document.getElementById('development-content'), file: MD_DEVELOPMENT },
    members: { element: document.getElementById('members-content'), file: MD_MEMBERS },
    news: { element: document.getElementById('news-content'), file: MD_NEWS },
    links: { element: document.getElementById('links-content'), file: MD_LINKS },
    docs: { element: document.getElementById('docs-content'), file: MD_DOCS }
  };

  /**
   * ** で囲まれた部分を <strong> に変換（marked.js は CJK 文字の直後の ** を認識しないため）
   */
  function preprocessBold(markdown) {
    return markdown.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  /**
   * * ひとつで囲まれた部分を <em> に変換（イタリック＋級数2pt下げ）
   */
  function preprocessItalic(markdown) {
    return markdown.replace(/\*([^*]+)\*/g, '<em class="em-smaller">$1</em>');
  }

  /**
   * テーブルセルの寄せクラスを返す（:--- 左 | :---: 中央 | ---: 右）
   */
  function getTableAlignClass(align, index) {
    const a = (align && align[index]) || 'left';
    return 'text-' + a;
  }

  /**
   * marked のテーブルレンダラーを拡張（列ごとの寄せを反映）
   */
  function initMarkedTableAlign() {
    marked.use({
      renderer: {
        table: function (token) {
          const align = token.align || [];
          const parser = this.parser;
          let html = '<table><thead><tr>';
          (token.header || []).forEach(function (cell, i) {
            const cls = getTableAlignClass(align, i);
            const content = (cell.tokens && parser.parseInline) ? parser.parseInline(cell.tokens) : (cell.text || '');
            html += '<th class="' + cls + '">' + content + '</th>';
          });
          html += '</tr></thead><tbody>';
          (token.rows || []).forEach(function (row) {
            html += '<tr>';
            (row || []).forEach(function (cell, i) {
              const cls = getTableAlignClass(align, i);
              const content = (cell.tokens && parser.parseInline) ? parser.parseInline(cell.tokens) : (cell.text || '');
              html += '<td class="' + cls + '">' + content + '</td>';
            });
            html += '</tr>';
          });
          html += '</tbody></table>';
          return html;
        }
      }
    });
  }

  /**
   * 別サイトへのリンクに target="_blank" と rel="noopener noreferrer" を付与
   */
  function setExternalLinksNewTab(container) {
    if (!container) return;
    const links = container.querySelectorAll('a[href^="http://"], a[href^="https://"]');
    links.forEach(function (a) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }

  /**
   * MarkdownファイルをフェッチしてHTMLに変換
   */
  async function loadMarkdown(key) {
    const config = sections[key];
    if (!config) return;
    const { element, file } = config;
    if (!element) return;

    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let markdown = await response.text();
      markdown = preprocessBold(markdown);
      markdown = preprocessItalic(markdown);
      element.innerHTML = marked.parse(markdown, { breaks: true });
      setExternalLinksNewTab(element);
    } catch (err) {
      console.error('Markdown load error:', err);
      element.innerHTML = '<p class="error">コンテンツの読み込みに失敗しました。Markdownファイル（' + file + '）が存在するか確認してください。</p>';
    }
  }

  /**
   * 全セクションのMarkdownを読み込み
   */
  async function loadAllMarkdown() {
    await Promise.all([
      loadMarkdown('home'),
      loadMarkdown('project'),
      loadMarkdown('development'),
      loadMarkdown('members'),
      loadMarkdown('news'),
      loadMarkdown('links'),
      loadMarkdown('docs')
    ]);
  }

  /**
   * ナビゲーションの切り替え
   */
  function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .logo');
    const sectionsEl = document.querySelectorAll('.section');

    function showSection(id) {
      sectionsEl.forEach(el => {
        el.classList.toggle('active', el.id === id);
      });
      navLinks.forEach(link => {
        const isLogo = link.classList.contains('logo');
        const isActive = (isLogo && id === 'home') || (!isLogo && link.getAttribute('data-page') === id);
        link.classList.toggle('active', isActive);
      });
    }

    navLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        const page = this.getAttribute('data-page');
        const targetId = this.getAttribute('href')?.replace('#', '') || page;
        if (targetId && document.getElementById(targetId)) {
          e.preventDefault();
          showSection(targetId);
          history.replaceState(null, '', '#' + targetId);
        }
      });
    });

    // ハッシュから初期表示を復元
    const hash = window.location.hash.replace('#', '') || 'home';
    if (document.getElementById(hash)) {
      showSection(hash);
    }
  }

  /**
   * モバイルメニュートグル
   */
  function initMobileMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
      });
      navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('open'));
      });
    }
  }

  /**
   * 初期化
   */
  async function init() {
    initMarkedTableAlign();
    initNavigation();
    initMobileMenu();
    await loadAllMarkdown();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
