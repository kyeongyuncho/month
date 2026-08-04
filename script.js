// ---- 좌측 메인 사이드바 접기/펼치기 ----
  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebar.style.display = sidebar.style.display === 'none' ? '' : 'none';
  });

  // ---- "행정" 섹션 아코디언 ----
  document.querySelectorAll('.nav-section-title').forEach(title => {
    title.addEventListener('click', () => {
      const target = document.getElementById(title.dataset.target);
      target.classList.toggle('collapsed');
      title.classList.toggle('collapsed');
    });
  });

  // ---- 상단 탭 전환 ----
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // ---- 좌측 메인 메뉴 항목 선택 ----
  document.querySelectorAll('#navAdmin .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('#navAdmin .nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ---- 센터정보관리 서브메뉴 전환 ----
  // panelData: 서브메뉴 클릭시 보여줄 제목/내용을 여기에 계속 등록해서 확장하면 됩니다.
  const panelData = {
    basic:      { title: '기본 정보',        html: '<div class="placeholder-box">기본 정보 화면을 이곳에 구현하세요.</div>' },
    profile:    { title: '센터장 프로필',     html: '<div class="placeholder-box">센터장 프로필 화면을 이곳에 구현하세요.</div>' },
    dept:       { title: '센터 부서',         html: '<div class="placeholder-box">센터 부서 화면을 이곳에 구현하세요.</div>' },
    staff:      { title: '센터 담당자',       html: '<div class="placeholder-box">여기에 "센터 담당자" 표/기능을 계속 추가해 나가면 됩니다.<br>(id="panel-content" 안에 원하는 HTML을 채워 넣으세요)</div>' },
    flextime:   { title: '근무시간(유연근무)', html: '<div class="placeholder-box">근무시간(유연근무) 화면을 이곳에 구현하세요.</div>' },
    special:    { title: '특화사업',          html: '<div class="placeholder-box">특화사업 화면을 이곳에 구현하세요.</div>' },
    holiday:    { title: '임시공휴일 관리',    html: '<div class="placeholder-box">임시공휴일 관리 화면을 이곳에 구현하세요.</div>' },
    grace:      { title: '출근유예 관리',      html: '<div class="placeholder-box">출근유예 관리 화면을 이곳에 구현하세요.</div>' },
    ip:         { title: '접속 IP 관리',      html: '<div class="placeholder-box">접속 IP 관리 화면을 이곳에 구현하세요.</div>' },
    concurrent: { title: '겸직 센터 관리',     html: '<div class="placeholder-box">겸직 센터 관리 화면을 이곳에 구현하세요.</div>' },
    changelog:  { title: '등록변경사항',       html: '<div class="placeholder-box">등록변경사항 화면을 이곳에 구현하세요.</div>' },
  };

  document.querySelectorAll('.sub-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sub-menu-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const key = item.dataset.panel;
      const data = panelData[key];
      if (data) {
        document.getElementById('panelTitle').textContent = data.title;
        document.getElementById('panel-content').innerHTML = data.html;
      }
    });
  });

  // ---- 출근/퇴근 버튼 데모 동작 ----
  function nowHHMM(){
    const d = new Date();
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }
  document.getElementById('checkinBtn').addEventListener('click', function(){
    this.textContent = '출근 ' + nowHHMM();
  });
  document.getElementById('checkoutBtn').addEventListener('click', function(){
    this.textContent = '퇴근 ' + nowHHMM();
  });
