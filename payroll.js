/* =====================================================
   급여 관리 (Payroll) 로직 v2

   구성
   1) 현황표(list view)   : 전체 직원 급여 현황 → 행 클릭 시 상세로 이동
   2) 상세(detail view)   : 지급/공제 입력 및 계산
   3) 공제 요율 설정 모달  : 담당자가 국민연금/건강보험 등 기본 요율(%)을 직접 입력
   4) 급여명세서 모달      : 회사 서식 틀 (자체 서식 파일 받으면 마크업만 교체하면 됨)
   5) 이메일 발송 모달     : 발송 UI. 실제 전송은 서버 API 연동 필요 (아래 TODO 참고)
   ===================================================== */

(function(){

  const fmt = (n) => Math.round(n).toLocaleString('ko-KR') + '원';

  /* -------------------------------------------------
     0. 기본 데이터 (실제로는 서버/DB에서 받아와야 함)
     ------------------------------------------------- */

  // 공제 요율 기본값 - "공제 요율 설정" 모달에서 담당자가 직접 수정 가능
  let deductionRates = {
    pension:   4.5,    // 국민연금 (과세대상소득 대비 %)
    health:    3.545,  // 건강보험 (과세대상소득 대비 %)
    longTerm:  12.95,  // 장기요양보험 (건강보험료 대비 %)
    employ:    0.9,    // 고용보험 (과세대상소득 대비 %)
    incomeTax: 3,       // 소득세 (과세대상소득 대비 %, 간이세액표 대신 임시 단순 요율)
    localTax:  10       // 지방소득세 (소득세 대비 %)
  };

  // 직원 목록 (샘플 데이터 - 실제로는 서버 API로 대체)
  const employees = [
    { id:'101002024006', name:'김영아', dept:'경영기획팀',       pos:'팀원', base:3200000, email:'michaela@ccfsm.or.kr' },
    { id:'101002023011', name:'김다은', dept:'식생활정책연구팀', pos:'팀원', base:3500000, email:'kimvv369@ccfsm.or.kr' },
    { id:'101002019002', name:'최경아', dept:'급식기준지원팀',   pos:'팀장', base:4800000, email:'intelly24@ccfsm.or.kr' },
    { id:'101002021004', name:'심재은', dept:'경영기획팀',       pos:'팀장', base:5200000, email:'simppong@ccfsm.or.kr' },
  ];

  function defaultPayItems(baseSalary){
    return [
      { name: '기본급',        amount: baseSalary, taxFree:false, locked:true  },
      { name: '직책수당',      amount: 200000,      taxFree:false, locked:false },
      { name: '식대',          amount: 200000,      taxFree:true,  locked:false },
      { name: '자가운전보조금', amount: 200000,      taxFree:true,  locked:false },
    ];
  }

  let currentEmployee = null;
  let payItems = [];
  let dedItems = [];

  /* -------------------------------------------------
     1. 현황표 (리스트 뷰)
     ------------------------------------------------- */

  function payTotalOf(baseSalary){
    return defaultPayItems(baseSalary).reduce((s,i)=>s+i.amount,0);
  }

  function renderList(){
    const month = document.getElementById('pr-list-month').value;
    const keyword = document.getElementById('pr-list-search').value.trim();
    const body = document.getElementById('pr-list-body');
    body.innerHTML = '';

    employees
      .filter(e => !keyword || e.name.includes(keyword))
      .forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${month}</td>
          <td>${e.name}</td>
          <td>${e.dept}</td>
          <td>${e.pos}</td>
          <td class="num">${fmt(payTotalOf(e.base))}</td>
        `;
        tr.addEventListener('click', () => openDetail(e, month));
        body.appendChild(tr);
      });
  }

  function openDetail(employee, month){
    currentEmployee = employee;
    document.getElementById('pr-employee-name').textContent = `${employee.name} (${employee.dept} / ${employee.pos})`;
    document.getElementById('pr-detail-month').textContent = month;

    payItems = defaultPayItems(employee.base);
    renderPay();
    recalcDeductions();

    document.getElementById('pr-list-view').style.display = 'none';
    document.getElementById('pr-detail-view').style.display = 'block';
    markUnsaved();
  }

  function backToList(){
    document.getElementById('pr-detail-view').style.display = 'none';
    document.getElementById('pr-list-view').style.display = 'block';
  }

  /* -------------------------------------------------
     2. 지급 항목
     ------------------------------------------------- */

  function taxableIncome(){
    return payItems.filter(i => !i.taxFree).reduce((s,i) => s + i.amount, 0);
  }
  function payTotal(){
    return payItems.reduce((s,i) => s + i.amount, 0);
  }

  function renderPay(){
    const body = document.getElementById('pr-pay-body');
    body.innerHTML = '';
    payItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input class="payroll-row-name" data-idx="${idx}" data-field="name" value="${item.name}" ${item.locked ? 'disabled' : ''}></td>
        <td><input class="payroll-row-amount" type="number" step="10000" data-idx="${idx}" data-field="amount" value="${item.amount}" ${item.locked ? 'disabled' : ''}></td>
        <td class="tag-col"><span class="payroll-tag ${item.taxFree ? 'on' : ''}" data-idx="${idx}" style="cursor:pointer;">${item.taxFree ? '비과세' : '과세'}</span></td>
        <td class="del-col">${item.locked ? '' : `<button type="button" class="payroll-row-del" data-idx="${idx}">×</button>`}</td>
      `;
      body.appendChild(tr);
    });

    body.querySelectorAll('.payroll-row-name, .payroll-row-amount').forEach(el => {
      el.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        payItems[idx][field] = field === 'amount' ? (Number(e.target.value) || 0) : e.target.value;
        recalcDeductions();
      });
    });
    body.querySelectorAll('.payroll-tag').forEach(el => {
      el.addEventListener('click', () => {
        payItems[Number(el.dataset.idx)].taxFree = !payItems[Number(el.dataset.idx)].taxFree;
        renderPay();
        recalcDeductions();
      });
    });
    body.querySelectorAll('.payroll-row-del').forEach(btn => {
      btn.addEventListener('click', () => {
        payItems.splice(Number(btn.dataset.idx), 1);
        renderPay();
        recalcDeductions();
      });
    });
  }

  /* -------------------------------------------------
     3. 공제 항목 (요율 직접 입력)
     ------------------------------------------------- */

  function buildDeductionItems(){
    const taxable = taxableIncome();
    const health = Math.round(taxable * deductionRates.health / 100 / 10) * 10;
    const incomeTax = Math.round(taxable * deductionRates.incomeTax / 100 / 10) * 10;

    return [
      { key:'pension',   name:'국민연금',     basis:'taxable', rate: deductionRates.pension,   amount: Math.round(taxable * deductionRates.pension / 100 / 10) * 10 },
      { key:'health',    name:'건강보험',     basis:'taxable', rate: deductionRates.health,    amount: health },
      { key:'longTerm',  name:'장기요양보험', basis:'health',   rate: deductionRates.longTerm,  amount: Math.round(health * deductionRates.longTerm / 100 / 10) * 10 },
      { key:'employ',    name:'고용보험',     basis:'taxable', rate: deductionRates.employ,    amount: Math.round(taxable * deductionRates.employ / 100 / 10) * 10 },
      { key:'incomeTax', name:'소득세',       basis:'taxable', rate: deductionRates.incomeTax, amount: incomeTax },
      { key:'localTax',  name:'지방소득세',   basis:'incomeTax',rate: deductionRates.localTax,  amount: Math.round(incomeTax * deductionRates.localTax / 100 / 10) * 10 },
    ];
  }

  function dedTotal(){
    return dedItems.reduce((s,i) => s + i.amount, 0);
  }

  function renderDed(){
    const body = document.getElementById('pr-ded-body');
    body.innerHTML = '';
    dedItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td><input class="payroll-row-rate" type="number" step="0.001" data-key="${item.key}" value="${item.rate}"></td>
        <td class="payroll-ded-amount">${fmt(item.amount)}</td>
      `;
      body.appendChild(tr);
    });
    body.querySelectorAll('.payroll-row-rate').forEach(el => {
      el.addEventListener('input', (e) => {
        deductionRates[e.target.dataset.key] = Number(e.target.value) || 0;
        recalcDeductions();
      });
    });
  }

  function recalcDeductions(){
    dedItems = buildDeductionItems();
    renderDed();
    updateTotals();
    markUnsaved();
  }

  function updateTotals(){
    const pTotal = payTotal();
    const dTotal = dedTotal();
    document.getElementById('pr-pay-total').textContent = fmt(pTotal);
    document.getElementById('pr-ded-total').textContent = fmt(dTotal);
    document.getElementById('pr-sum-pay').textContent = fmt(pTotal);
    document.getElementById('pr-sum-ded').textContent = fmt(dTotal);
    document.getElementById('pr-sum-net').textContent = fmt(pTotal - dTotal);
  }

  function markUnsaved(){
    const status = document.getElementById('pr-status');
    if(!status) return;
    status.textContent = '임시저장';
    status.classList.remove('saved');
  }

  /* -------------------------------------------------
     4. 공제 요율 설정 모달
     ------------------------------------------------- */

  const rateLabels = {
    pension:'국민연금 (%)', health:'건강보험 (%)', longTerm:'장기요양보험 (건강보험료 대비 %)',
    employ:'고용보험 (%)', incomeTax:'소득세 (임시 단순 요율, %)', localTax:'지방소득세 (소득세 대비 %)'
  };

  function openRateSetting(){
    const body = document.getElementById('pr-rate-modal-body');
    body.innerHTML = Object.keys(deductionRates).map(key => `
      <div class="rate-setting-row">
        <label>${rateLabels[key]}</label>
        <input type="number" step="0.001" id="rate-input-${key}" value="${deductionRates[key]}">
      </div>
    `).join('');
    document.getElementById('pr-rate-modal-overlay').classList.add('open');
  }

  function saveRateSetting(){
    Object.keys(deductionRates).forEach(key => {
      const input = document.getElementById(`rate-input-${key}`);
      if(input) deductionRates[key] = Number(input.value) || 0;
    });
    document.getElementById('pr-rate-modal-overlay').classList.remove('open');
    // 상세 화면이 열려있으면 새 요율로 즉시 재계산
    if (currentEmployee) recalcDeductions();
    // TODO: 서버에 요율 저장 API 연동 지점
    // fetch('/api/payroll/deduction-rates', { method:'PUT', body: JSON.stringify(deductionRates) })
  }

  /* -------------------------------------------------
     5. 급여명세서 모달 (회사 서식)
     -------------------------------------------------
     아래는 표준 급여명세서 형태의 임시 틀입니다.
     실제 사용 중인 서식 파일(이미지/한글/엑셀)을 공유해주시면
     이 함수 안의 마크업만 그 레이아웃에 맞게 교체하면 됩니다.
  */

  function openPayslip(){
    if(!currentEmployee) return;
    const month = document.getElementById('pr-detail-month').textContent;

    const payRows = payItems.map(i =>
      `<div class="payslip-row"><span>${i.name}${i.taxFree ? ' (비과세)' : ''}</span><span>${fmt(i.amount)}</span></div>`
    ).join('');
    const dedRows = dedItems.map(i =>
      `<div class="payslip-row"><span>${i.name}</span><span>${fmt(i.amount)}</span></div>`
    ).join('');

    document.getElementById('pr-modal-body').innerHTML = `
      <div class="payslip-form">
        <div class="payslip-form-head">
          <div class="title">급 여 명 세 서</div>
          <div class="sub">식생활안전관리원 · 어린이·사회복지급식관리지원센터</div>
        </div>
        <div class="payslip-meta">
          <div>귀속연월<b>${month}</b></div>
          <div>지급일<b>${month}-25</b></div>
          <div>성명<b>${currentEmployee.name}</b></div>
          <div>소속 / 직위<b>${currentEmployee.dept} / ${currentEmployee.pos}</b></div>
        </div>
        <div class="payslip-cols">
          <div class="col">
            <div class="col-title">지급 내역</div>
            ${payRows}
          </div>
          <div class="col">
            <div class="col-title">공제 내역</div>
            ${dedRows}
          </div>
        </div>
        <div class="payslip-net">실지급액&nbsp; ${fmt(payTotal() - dedTotal())}</div>
        <div class="payslip-note">본 명세서는 위 내용의 급여가 지급되었음을 확인합니다.</div>
      </div>
    `;
    document.getElementById('pr-modal-overlay').classList.add('open');
  }

  /* -------------------------------------------------
     6. 이메일 발송 모달
     -------------------------------------------------
     주의: 브라우저 JS만으로는 메일을 실제로 보낼 수 없습니다.
     아래 sendEmail()의 fetch 호출부를 실제 백엔드 메일 발송 API로
     교체해야 합니다. (예: 사내 SMTP 게이트웨이, SendGrid 등)
  */

  function openEmailModal(){
    if(!currentEmployee) return;
    const month = document.getElementById('pr-detail-month').textContent;
    document.getElementById('pr-email-to').value = currentEmployee.email;
    document.getElementById('pr-email-subject').value = `[${month}] 급여명세서 안내`;
    document.getElementById('pr-email-body').value =
      `${currentEmployee.name}님, ${month} 급여명세서를 첨부와 같이 안내드립니다.`;
    document.getElementById('pr-email-status').textContent = '';
    document.getElementById('pr-email-modal-overlay').classList.add('open');
  }

  function sendEmail(){
    const statusEl = document.getElementById('pr-email-status');
    const payload = {
      to: document.getElementById('pr-email-to').value,
      subject: document.getElementById('pr-email-subject').value,
      body: document.getElementById('pr-email-body').value,
      employeeId: currentEmployee ? currentEmployee.id : null,
      month: document.getElementById('pr-detail-month').textContent,
    };

    statusEl.textContent = '발송 중...';

    // TODO: 실제 서버 API로 교체
    // fetch('/api/payroll/send-payslip-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // })
    //   .then(res => res.json())
    //   .then(() => { statusEl.textContent = '발송 완료'; })
    //   .catch(() => { statusEl.textContent = '발송 실패. 다시 시도해주세요.'; });

    // 데모용 임시 처리 (실제 연동 전까지)
    setTimeout(() => {
      statusEl.textContent = '발송 완료 (데모 - 실제 전송 아님)';
    }, 500);
  }

  /* -------------------------------------------------
     7. 이벤트 바인딩
     ------------------------------------------------- */

  function bindEvents(){
    document.getElementById('pr-list-month').addEventListener('change', renderList);
    document.getElementById('pr-list-search').addEventListener('input', renderList);
    document.getElementById('pr-back-to-list').addEventListener('click', backToList);

    document.getElementById('pr-add-pay').addEventListener('click', () => {
      payItems.push({ name: '추가 수당', amount: 0, taxFree:false, locked:false });
      renderPay();
      recalcDeductions();
    });

    document.getElementById('pr-save').addEventListener('click', () => {
      const status = document.getElementById('pr-status');
      status.textContent = '저장됨';
      status.classList.add('saved');
      // TODO: 서버 저장 API 연동 지점
      // fetch('/api/payroll', { method:'POST', body: JSON.stringify({ employee: currentEmployee, payItems, dedItems }) })
    });

    document.getElementById('pr-rate-setting').addEventListener('click', openRateSetting);
    document.getElementById('pr-rate-modal-close').addEventListener('click', () =>
      document.getElementById('pr-rate-modal-overlay').classList.remove('open'));
    document.getElementById('pr-rate-modal-save').addEventListener('click', saveRateSetting);

    document.getElementById('pr-preview').addEventListener('click', openPayslip);
    document.getElementById('pr-modal-close').addEventListener('click', () =>
      document.getElementById('pr-modal-overlay').classList.remove('open'));
    document.getElementById('pr-modal-print').addEventListener('click', () => window.print());

    document.getElementById('pr-email-open').addEventListener('click', openEmailModal);
    document.getElementById('pr-email-modal-close').addEventListener('click', () =>
      document.getElementById('pr-email-modal-overlay').classList.remove('open'));
    document.getElementById('pr-email-send').addEventListener('click', sendEmail);

    // 오버레이 바깥 클릭 시 닫기
    ['pr-rate-modal-overlay','pr-modal-overlay','pr-email-modal-overlay'].forEach(id => {
      document.getElementById(id).addEventListener('click', (e) => {
        if (e.target.id === id) document.getElementById(id).classList.remove('open');
      });
    });
  }

  function initPayroll(){
    if (!document.getElementById('pr-list-body')) return; // 이 패널이 DOM에 없으면 skip
    bindEvents();
    renderList();
  }

  document.addEventListener('DOMContentLoaded', initPayroll);
  // panelData처럼 innerHTML로 나중에 삽입하는 구조라면, 삽입 직후 window.initPayroll()을 호출하세요.
  window.initPayroll = initPayroll;

})();
