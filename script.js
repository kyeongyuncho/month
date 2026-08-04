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
    salary:     { title: '급여 관리',         html: '<div class="placeholder-box">급여 관리 화면을 이곳에 구현하세요.</div>' },
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


(function(){

  const fmt = (n) => Math.round(n).toLocaleString('ko-KR') + '원';

  // 지급 항목 상태 (name, amount, taxFree(비과세 여부), locked(수정불가))
  let payItems = [];
  // 공제 항목 상태 (name, amount, rate표시)
  let dedItems = [];

  function defaultPayItems(baseSalary){
    return [
      { name: '기본급',        amount: baseSalary, taxFree:false, locked:true  },
      { name: '직책수당',      amount: 200000,      taxFree:false, locked:false },
      { name: '식대',          amount: 200000,      taxFree:true,  locked:false },
      { name: '자가운전보조금', amount: 200000,      taxFree:true,  locked:false },
    ];
  }

  function taxableIncome(){
    return payItems
      .filter(i => !i.taxFree)
      .reduce((sum, i) => sum + i.amount, 0);
  }

  function payTotal(){
    return payItems.reduce((sum, i) => sum + i.amount, 0);
  }

  /* -------- 공제 자동 계산 -------- */
  function calcIncomeTax(taxable){
    // TODO: 국세청 간이세액표로 교체
    return Math.round(taxable * 0.03 / 10) * 10;
  }

  function autoDeductions(){
    const taxable = taxableIncome();
    const pension   = Math.round(taxable * 0.045 / 10) * 10;      // 국민연금 4.5%
    const health    = Math.round(taxable * 0.03545 / 10) * 10;    // 건강보험 3.545%
    const longTerm  = Math.round(health * 0.1295 / 10) * 10;      // 장기요양보험 (건강보험료의 12.95%)
    const employ    = Math.round(taxable * 0.009 / 10) * 10;      // 고용보험 0.9%
    const incomeTax = calcIncomeTax(taxable);                     // 소득세
    const localTax  = Math.round(incomeTax * 0.1 / 10) * 10;      // 지방소득세 (소득세의 10%)

    return [
      { name: '국민연금',     amount: pension,   rate: '4.5%' },
      { name: '건강보험',     amount: health,    rate: '3.545%' },
      { name: '장기요양보험', amount: longTerm,  rate: '건강보험×12.95%' },
      { name: '고용보험',     amount: employ,    rate: '0.9%' },
      { name: '소득세',       amount: incomeTax, rate: '간이세액(단순화)' },
      { name: '지방소득세',   amount: localTax,  rate: '소득세×10%' },
    ];
  }

  function dedTotal(){
    return dedItems.reduce((sum, i) => sum + i.amount, 0);
  }

  /* -------- 렌더링 -------- */
  function renderPay(){
    const body = document.getElementById('pr-pay-body');
    body.innerHTML = '';
    payItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input class="payroll-row-name" data-idx="${idx}" data-field="name" value="${item.name}" ${item.locked ? 'disabled' : ''}></td>
        <td><input class="payroll-row-amount" type="number" step="10000" data-idx="${idx}" data-field="amount" value="${item.amount}" ${item.locked ? 'disabled' : ''}></td>
        <td class="tag-col"><span class="payroll-tag ${item.taxFree ? 'on' : ''}" data-idx="${idx}" data-field="taxFree" style="cursor:pointer;">${item.taxFree ? '비과세' : '과세'}</span></td>
        <td class="del-col">${item.locked ? '' : `<button type="button" class="payroll-row-del" data-idx="${idx}">×</button>`}</td>
      `;
      body.appendChild(tr);
    });

    body.querySelectorAll('.payroll-row-name, .payroll-row-amount').forEach(el => {
      el.addEventListener('input', onPayFieldChange);
    });
    body.querySelectorAll('.payroll-tag').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.idx);
        payItems[idx].taxFree = !payItems[idx].taxFree;
        renderPay();
        recalc();
      });
    });
    body.querySelectorAll('.payroll-row-del').forEach(btn => {
      btn.addEventListener('click', () => {
        payItems.splice(Number(btn.dataset.idx), 1);
        renderPay();
        recalc();
      });
    });
  }

  function onPayFieldChange(e){
    const idx = Number(e.target.dataset.idx);
    const field = e.target.dataset.field;
    payItems[idx][field] = field === 'amount' ? (Number(e.target.value) || 0) : e.target.value;
    recalc(false); // 입력 중엔 목록 재렌더링 없이 합계만 갱신
  }

  function renderDed(){
    const body = document.getElementById('pr-ded-body');
    const autoMode = document.getElementById('pr-auto-calc').checked;
    body.innerHTML = '';
    dedItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td><input class="payroll-row-amount" type="number" step="10" data-idx="${idx}" value="${item.amount}" ${autoMode ? 'disabled' : ''}></td>
        <td class="tag-col"><span class="payroll-rate">${item.rate}</span></td>
      `;
      body.appendChild(tr);
    });
    if(!autoMode){
      body.querySelectorAll('.payroll-row-amount').forEach(el => {
        el.addEventListener('input', (e) => {
          dedItems[Number(e.target.dataset.idx)].amount = Number(e.target.value) || 0;
          updateTotals();
        });
      });
    }
  }

  function updateTotals(){
    const pTotal = payTotal();
    const dTotal = dedTotal();
    const net = pTotal - dTotal;

    document.getElementById('pr-pay-total').textContent = fmt(pTotal);
    document.getElementById('pr-ded-total').textContent = fmt(dTotal);
    document.getElementById('pr-sum-pay').textContent = fmt(pTotal);
    document.getElementById('pr-sum-ded').textContent = fmt(dTotal);
    document.getElementById('pr-sum-net').textContent = fmt(net);
  }

  function recalc(rerenderPayList = true){
    if (document.getElementById('pr-auto-calc').checked){
      dedItems = autoDeductions();
      renderDed();
    }
    if (rerenderPayList) { /* 필요시 renderPay() 재호출 지점 */ }
    updateTotals();
    markUnsaved();
  }

  function markUnsaved(){
    const status = document.getElementById('pr-status');
    status.textContent = '임시저장';
    status.classList.remove('saved');
  }

  /* -------- 미리보기 모달 -------- */
  function openPreview(){
    const employeeSel = document.getElementById('pr-employee');
    const monthSel = document.getElementById('pr-month');
    const name = employeeSel.options[employeeSel.selectedIndex].text;
    const month = monthSel.value;

    let rows = '';
    payItems.forEach(i => {
      rows += `<div class="payroll-modal-row"><span>${i.name}${i.taxFree ? ' (비과세)' : ''}</span><span>${fmt(i.amount)}</span></div>`;
    });
    rows += `<div class="payroll-modal-row"><b>지급 총액</b><b>${fmt(payTotal())}</b></div>`;
    dedItems.forEach(i => {
      rows += `<div class="payroll-modal-row"><span>${i.name}</span><span>-${fmt(i.amount)}</span></div>`;
    });
    rows += `<div class="payroll-modal-row"><b>공제 총액</b><b>-${fmt(dedTotal())}</b></div>`;
    rows += `<div class="payroll-modal-row net"><span>실지급액</span><span>${fmt(payTotal() - dedTotal())}</span></div>`;

    document.getElementById('pr-modal-body').innerHTML = `
      <div style="margin-bottom:12px;">
        <div style="font-weight:700;font-size:14px;">${name}</div>
        <div style="color:var(--gray-700);font-size:12px;">귀속월: ${month}</div>
      </div>
      ${rows}
    `;
    document.getElementById('pr-modal-overlay').classList.add('open');
  }

  function closePreview(){
    document.getElementById('pr-modal-overlay').classList.remove('open');
  }

  /* -------- 초기화 -------- */
  function initEmployee(){
    const sel = document.getElementById('pr-employee');
    const base = Number(sel.options[sel.selectedIndex].dataset.base) || 0;
    payItems = defaultPayItems(base);
    renderPay();
    recalc();
  }

  function bindEvents(){
    document.getElementById('pr-employee').addEventListener('change', initEmployee);
    document.getElementById('pr-month').addEventListener('change', markUnsaved);

    document.getElementById('pr-add-pay').addEventListener('click', () => {
      payItems.push({ name: '추가 수당', amount: 0, taxFree:false, locked:false });
      renderPay();
      recalc();
    });

    document.getElementById('pr-auto-calc').addEventListener('change', () => recalc());

    document.getElementById('pr-save').addEventListener('click', () => {
      const status = document.getElementById('pr-status');
      status.textContent = '저장됨';
      status.classList.add('saved');
      // TODO: 서버 저장 API 연동 지점
      // fetch('/api/payroll', { method:'POST', body: JSON.stringify({ payItems, dedItems }) })
    });

    document.getElementById('pr-preview').addEventListener('click', openPreview);
    document.getElementById('pr-modal-close').addEventListener('click', closePreview);
    document.getElementById('pr-modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'pr-modal-overlay') closePreview();
    });
    document.getElementById('pr-modal-print').addEventListener('click', () => window.print());
  }

  function initPayroll(){
    if (!document.getElementById('pr-employee')) return; // 이 패널이 DOM에 없으면 skip
    bindEvents();
    initEmployee();
  }

  // panel-content가 페이지 로드 시 이미 DOM에 있다면 바로 초기화
  document.addEventListener('DOMContentLoaded', initPayroll);
  // panelData처럼 innerHTML로 나중에 삽입하는 구조라면, 삽입 직후 아래 함수를 직접 호출하세요.
  window.initPayroll = initPayroll;

})();
