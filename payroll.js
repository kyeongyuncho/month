/* =====================================================
   급여 관리 (Payroll) 로직 v3

   구성
   1) 현황표(list view)     : 전체 직원 급여 현황 → 행 클릭 시 상세로 이동
   2) 급여대장(ledger view) : 저장된 직원×월별 급여 이력 조회
   3) 상세(detail view)     : 프로필 헤더 + 지급/공제 입력 및 계산
   4) 공제 요율 설정 모달    : 국민연금/건강보험 등 기본 요율(%) 직접 입력
   5) 지급 항목 설정 모달    : 기본급/급식비/직급보조비 등 전체 직원 기본 적용 항목 관리
   6) 직원별 연봉 설정 모달  : 직원마다 연봉을 입력하면 월 급여는 연봉÷12로 자동 계산
   7) 급여명세서 / 이메일 발송 모달
   ===================================================== */

(function(){

  const fmt = (n) => Math.round(n).toLocaleString('ko-KR') + '원';
  const round10 = (n) => Math.round(n / 10) * 10;

  /* -------------------------------------------------
     0. 기본 데이터 (실제로는 서버/DB 및 인사정보 시스템에서 받아와야 함)
     ------------------------------------------------- */

  // 공제 요율 기본값 - "공제 요율 설정" 모달에서 직접 수정 가능
  let deductionRates = {
    pension:   4.5,
    health:    3.545,
    longTerm:  12.95,
    employ:    0.9,
    incomeTax: 3,
    localTax:  10
  };

  // 지급 항목 마스터(분류코드) - "지급 항목 설정" 모달에서 관리.
  // key:'base'는 기본급 전용 코드로, amount는 항상 연봉÷12로 자동 계산되며 수정 불가(locked)입니다.
  let payItemCodes = [
    { key:'base',             name:'기본급',          defaultAmount:0,      taxFree:false, locked:true  },
    { key:'meal',             name:'급식비',          defaultAmount:0,      taxFree:true,  locked:false },
    { key:'posAllowance',     name:'직급보조비',      defaultAmount:0,      taxFree:false, locked:false },
    { key:'overtime',         name:'연장근로수당',    defaultAmount:0,      taxFree:false, locked:false },
    { key:'family',           name:'가족수당',        defaultAmount:0,      taxFree:false, locked:false },
    { key:'annualLeaveComp',  name:'연차휴가보상수당', defaultAmount:0,      taxFree:false, locked:false },
    { key:'unpaidLeave',      name:'무급휴가',        defaultAmount:0,      taxFree:false, locked:false },
  ];

  // 직원 목록 (샘플 데이터 - 실제로는 인사정보 시스템 API로 대체)
  // TODO: 인사정보 연동 시 photo(사진 URL), jikchaek(직책), jikwi(직위), hobong(호봉)을
  //       GET /api/employees 응답 필드로 교체하세요.
  let employees = [
    { id:'101002024006', name:'심재운', dept:'경영기획팀',       jikchaek:'팀장', jikwi:'책임', hobong:3, annualSalary:50000000, email:'000@ccfsm.or.kr', photo:null },
    { id:'101002023011', name:'유정미', dept:'경영기획팀',      jikchaek:'팀원', jikwi:'주임', hobong:1, annualSalary:40000000, email:'000@ccfsm.or.kr', photo:null },
    { id:'101002019002', name:'김성연', dept:'경영기획팀',        jikchaek:'팀원', jikwi:'주임', hobong:7, annualSalary:30000000, email:'000@ccfsm.or.kr', photo:null },
    { id:'101002021004', name:'김준석', dept:'경영기획팀',       jikchaek:'팀원', jikwi:'주임', hobong:9, annualSalary:20000000, email:'000@ccfsm.or.kr', photo:null },
    { id:'101002021004', name:'조경윤', dept:'경영기획팀',       jikchaek:'팀원', jikwi:'주임', hobong:9, annualSalary:10000000, email:'000@ccfsm.or.kr', photo:null },
  ];

  // 급여대장 - "저장" 시 직원×귀속월 단위로 upsert됩니다. (실제로는 서버 DB에 저장)
  // 구조: { employeeId, name, dept, month, payItems, dedItems, payTotal, dedTotal, net, savedAt }
  let ledgerRecords = [];

  let currentEmployee = null;
  let payItems = [];
  let dedItems = [];

  /* -------------------------------------------------
     1. 지급 항목 계산 (연봉 → 월 기본급 자동 환산 포함)
     ------------------------------------------------- */

  function monthlyBaseOf(employee){
    return round10(employee.annualSalary / 12);
  }

  function buildDefaultPayItems(employee){
    return payItemCodes.map(code => ({
      name: code.name,
      amount: code.key === 'base' ? monthlyBaseOf(employee) : code.defaultAmount,
      taxFree: code.taxFree,
      locked: code.locked,
    }));
  }

  function taxableIncome(){
    return payItems.filter(i => !i.taxFree).reduce((s,i) => s + i.amount, 0);
  }
  function payTotal(){
    return payItems.reduce((s,i) => s + i.amount, 0);
  }

  /* -------------------------------------------------
     2. 현황표 (리스트 뷰)
     ------------------------------------------------- */

  function estimatedPayTotal(employee){
    return buildDefaultPayItems(employee).reduce((s,i)=>s+i.amount,0);
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
          <td>${e.dept}</td>
          <td>${e.jikchaek}</td>
          <td>${e.name}</td>
          <td class="num">${fmt(estimatedPayTotal(e))}</td>
        `;
        tr.addEventListener('click', () => openDetail(e, month));
        body.appendChild(tr);
      });
  }

  /* -------------------------------------------------
     3. 상세 뷰 (프로필 헤더 포함)
     ------------------------------------------------- */

  function renderProfileHeader(employee){
    document.getElementById('pr-profile-photo').innerHTML = employee.photo
      ? `<img src="${employee.photo}" alt="${employee.name}">`
      : employee.name.slice(-2);
    document.getElementById('pr-profile-name').textContent = employee.name;
    document.getElementById('pr-profile-dept').textContent = employee.dept;
    document.getElementById('pr-profile-jikchaek').textContent = employee.jikchaek;
    document.getElementById('pr-profile-jikwi').textContent = employee.jikwi;
    document.getElementById('pr-profile-hobong').textContent = employee.hobong + '호봉';
  }

  function openDetail(employee, month){
    currentEmployee = employee;
    renderProfileHeader(employee);
    document.getElementById('pr-detail-month').textContent = month;

    // 이미 저장된 급여대장 기록이 있으면 그 데이터를 불러오고, 없으면 지급항목 마스터 기본값 적용
    const existing = ledgerRecords.find(r => r.employeeId === employee.id && r.month === month);
    if (existing) {
      payItems = JSON.parse(JSON.stringify(existing.payItems));
    } else {
      payItems = buildDefaultPayItems(employee);
    }

    renderPay();
    recalcDeductions();

    document.getElementById('pr-list-view').style.display = 'none';
    document.getElementById('pr-ledger-view').style.display = 'none';
    document.getElementById('pr-detail-view').style.display = 'block';

    const status = document.getElementById('pr-status');
    if (existing) {
      status.textContent = '저장됨';
      status.classList.add('saved');
    } else {
      markUnsaved();
    }
  }

  function backToList(){
    document.getElementById('pr-detail-view').style.display = 'none';
    document.getElementById('pr-ledger-view').style.display = 'none';
    document.getElementById('pr-list-view').style.display = 'block';
  }

  /* -------------------------------------------------
     4. 지급 항목 (상세 화면 표)
     ------------------------------------------------- */

  function renderPay(){
    const body = document.getElementById('pr-pay-body');
    body.innerHTML = '';
    payItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input class="payroll-row-name" data-idx="${idx}" data-field="name" value="${item.name}" ${item.locked ? 'disabled' : ''}></td>
        <td><input class="payroll-row-amount" type="number" step="10000" data-idx="${idx}" data-field="amount" value="${item.amount}" ${item.locked ? 'disabled' : ''}></td>
        <td class="tag-col"><span class="payroll-tag ${item.taxFree ? 'on' : ''}" data-idx="${idx}">${item.taxFree ? '비과세' : '과세'}</span></td>
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
     5. 공제 항목 (요율 직접 입력)
     ------------------------------------------------- */

  function buildDeductionItems(){
    const taxable = taxableIncome();
    const health = round10(taxable * deductionRates.health / 100);
    const incomeTax = round10(taxable * deductionRates.incomeTax / 100);

    return [
      { key:'pension',   name:'국민연금',     rate: deductionRates.pension,   amount: round10(taxable * deductionRates.pension / 100) },
      { key:'health',    name:'건강보험',     rate: deductionRates.health,    amount: health },
      { key:'longTerm',  name:'장기요양보험', rate: deductionRates.longTerm,  amount: round10(health * deductionRates.longTerm / 100) },
      { key:'employ',    name:'고용보험',     rate: deductionRates.employ,    amount: round10(taxable * deductionRates.employ / 100) },
      { key:'incomeTax', name:'소득세',       rate: deductionRates.incomeTax, amount: incomeTax },
      { key:'localTax',  name:'지방소득세',   rate: deductionRates.localTax,  amount: round10(incomeTax * deductionRates.localTax / 100) },
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
     6. 공제 요율 설정 모달
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
    if (currentEmployee) recalcDeductions();
    // TODO: 서버에 요율 저장 API 연동 지점
    // fetch('/api/payroll/deduction-rates', { method:'PUT', body: JSON.stringify(deductionRates) })
  }

  /* -------------------------------------------------
     7. 지급 항목(분류코드) 설정 모달
     ------------------------------------------------- */

  function openPayItemSetting(){
    renderPayItemSettingRows();
    document.getElementById('pr-payitem-modal-overlay').classList.add('open');
  }

  function renderPayItemSettingRows(){
    const body = document.getElementById('pr-payitem-modal-body');
    body.innerHTML = payItemCodes.map((code, idx) => `
      <div class="payitem-setting-row" data-idx="${idx}">
        <input type="text" class="pi-name" value="${code.name}" ${code.locked ? 'disabled' : ''}>
        <input type="number" class="pi-amount" step="10000" value="${code.defaultAmount}" ${code.key === 'base' ? 'disabled placeholder="연봉÷12"' : ''}>
        <span class="payroll-tag pi-taxfree ${code.taxFree ? 'on' : ''}">${code.taxFree ? '비과세' : '과세'}</span>
        ${code.locked ? '<span></span>' : '<button type="button" class="payroll-row-del pi-del">×</button>'}
      </div>
    `).join('');

    body.querySelectorAll('.pi-taxfree').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.closest('.payitem-setting-row').dataset.idx);
        payItemCodes[idx].taxFree = !payItemCodes[idx].taxFree;
        renderPayItemSettingRows();
      });
    });
    body.querySelectorAll('.pi-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.closest('.payitem-setting-row').dataset.idx);
        payItemCodes.splice(idx, 1);
        renderPayItemSettingRows();
      });
    });
  }

  function addPayItemCode(){
    payItemCodes.push({ key:'custom' + Date.now(), name:'새 항목', defaultAmount:0, taxFree:false, locked:false });
    renderPayItemSettingRows();
  }

  function savePayItemSetting(){
    document.querySelectorAll('#pr-payitem-modal-body .payitem-setting-row').forEach(row => {
      const idx = Number(row.dataset.idx);
      const nameInput = row.querySelector('.pi-name');
      const amountInput = row.querySelector('.pi-amount');
      if (!payItemCodes[idx].locked) payItemCodes[idx].name = nameInput.value;
      if (payItemCodes[idx].key !== 'base') payItemCodes[idx].defaultAmount = Number(amountInput.value) || 0;
    });
    document.getElementById('pr-payitem-modal-overlay').classList.remove('open');
    renderList();
    // TODO: 서버에 지급 항목 마스터 저장 API 연동 지점
    // fetch('/api/payroll/pay-item-codes', { method:'PUT', body: JSON.stringify(payItemCodes) })
  }

  /* -------------------------------------------------
     8. 직원별 연봉 설정 모달
     ------------------------------------------------- */

  function openSalarySetting(){
    const body = document.getElementById('pr-salary-modal-body');
    body.innerHTML = employees.map((e, idx) => `
      <div class="salary-setting-row" data-idx="${idx}">
        <span class="emp-name">${e.name} (${e.dept})</span>
        <input type="number" class="sal-input" step="100000" value="${e.annualSalary}">
        <span class="monthly-hint" id="sal-hint-${idx}">${fmt(round10(e.annualSalary/12))}/월</span>
      </div>
    `).join('');

    body.querySelectorAll('.sal-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = Number(e.target.closest('.salary-setting-row').dataset.idx);
        const val = Number(e.target.value) || 0;
        document.getElementById(`sal-hint-${idx}`).textContent = fmt(round10(val/12)) + '/월';
      });
    });

    document.getElementById('pr-salary-modal-overlay').classList.add('open');
  }

  function saveSalarySetting(){
    document.querySelectorAll('#pr-salary-modal-body .salary-setting-row').forEach(row => {
      const idx = Number(row.dataset.idx);
      const input = row.querySelector('.sal-input');
      employees[idx].annualSalary = Number(input.value) || 0;
    });
    document.getElementById('pr-salary-modal-overlay').classList.remove('open');
    renderList();
    // TODO: 서버에 직원별 연봉 저장 API 연동 지점
    // fetch('/api/employees/annual-salary', { method:'PUT', body: JSON.stringify(employees.map(e=>({id:e.id, annualSalary:e.annualSalary}))) })
  }

  /* -------------------------------------------------
     9. 급여대장 (저장 이력 조회)
     ------------------------------------------------- */

  function populateLedgerFilters(){
    const empSel = document.getElementById('pr-ledger-employee');
    empSel.innerHTML = '<option value="">전체</option>' +
      employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');

    const monthSel = document.getElementById('pr-ledger-month');
    const months = [...new Set(ledgerRecords.map(r => r.month))].sort().reverse();
    monthSel.innerHTML = '<option value="">전체</option>' +
      months.map(m => `<option value="${m}">${m}</option>`).join('');
  }

  function openLedger(){
    populateLedgerFilters();
    renderLedger();
    document.getElementById('pr-list-view').style.display = 'none';
    document.getElementById('pr-detail-view').style.display = 'none';
    document.getElementById('pr-ledger-view').style.display = 'block';
  }

  function renderLedger(){
    const empFilter = document.getElementById('pr-ledger-employee').value;
    const monthFilter = document.getElementById('pr-ledger-month').value;
    const body = document.getElementById('pr-ledger-body');
    const emptyBox = document.getElementById('pr-ledger-empty');
    body.innerHTML = '';

    const rows = ledgerRecords
      .filter(r => (!empFilter || r.employeeId === empFilter) && (!monthFilter || r.month === monthFilter))
      .sort((a,b) => b.month.localeCompare(a.month));

    emptyBox.style.display = rows.length ? 'none' : 'block';

    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.month}</td>
        <td>${r.name}</td>
        <td>${r.dept}</td>
        <td class="num">${fmt(r.payTotal)}</td>
        <td class="num">${fmt(r.dedTotal)}</td>
        <td class="num">${fmt(r.net)}</td>
        <td>${r.savedAt}</td>
      `;
      tr.addEventListener('click', () => {
        const employee = employees.find(e => e.id === r.employeeId);
        if (employee) openDetail(employee, r.month);
      });
      body.appendChild(tr);
    });
  }

  function saveToLedger(){
    if (!currentEmployee) return;
    const month = document.getElementById('pr-detail-month').textContent;
    const pTotal = payTotal();
    const dTotal = dedTotal();

    const record = {
      employeeId: currentEmployee.id,
      name: currentEmployee.name,
      dept: currentEmployee.dept,
      month,
      payItems: JSON.parse(JSON.stringify(payItems)),
      dedItems: JSON.parse(JSON.stringify(dedItems)),
      payTotal: pTotal,
      dedTotal: dTotal,
      net: pTotal - dTotal,
      savedAt: new Date().toLocaleString('ko-KR'),
    };

    const idx = ledgerRecords.findIndex(r => r.employeeId === record.employeeId && r.month === record.month);
    if (idx >= 0) ledgerRecords[idx] = record; else ledgerRecords.push(record);

    const status = document.getElementById('pr-status');
    status.textContent = '저장됨';
    status.classList.add('saved');
    // TODO: 서버 저장 API 연동 지점
    // fetch('/api/payroll', { method:'POST', body: JSON.stringify(record) })
  }

  /* -------------------------------------------------
     10. 급여명세서 모달 (회사 서식)
     -------------------------------------------------
     실제 사용 중인 서식 파일을 공유해주시면 이 함수 안의 마크업만
     그 레이아웃에 맞게 교체하면 됩니다.
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
          <div>소속 / 직책 / 직위<b>${currentEmployee.dept} / ${currentEmployee.jikchaek} / ${currentEmployee.jikwi}(${currentEmployee.hobong}호봉)</b></div>
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
     11. 이메일 발송 모달
     -------------------------------------------------
     주의: 브라우저 JS만으로는 메일을 실제로 보낼 수 없습니다.
     sendEmail()의 fetch 호출부를 실제 백엔드 메일 발송 API로 교체하세요.
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

    setTimeout(() => {
      statusEl.textContent = '발송 완료 (데모 - 실제 전송 아님)';
    }, 500);
  }

  /* -------------------------------------------------
     12. 이벤트 바인딩
     ------------------------------------------------- */

  function bindEvents(){
    document.getElementById('pr-list-month').addEventListener('change', renderList);
    document.getElementById('pr-list-search').addEventListener('input', renderList);
    document.getElementById('pr-back-to-list').addEventListener('click', backToList);

    document.getElementById('pr-ledger-open').addEventListener('click', openLedger);
    document.getElementById('pr-ledger-back').addEventListener('click', backToList);
    document.getElementById('pr-ledger-employee').addEventListener('change', renderLedger);
    document.getElementById('pr-ledger-month').addEventListener('change', renderLedger);

    document.getElementById('pr-add-pay').addEventListener('click', () => {
      payItems.push({ name: '추가 수당', amount: 0, taxFree:false, locked:false });
      renderPay();
      recalcDeductions();
    });

    document.getElementById('pr-save').addEventListener('click', saveToLedger);

    document.getElementById('pr-rate-setting').addEventListener('click', openRateSetting);
    document.getElementById('pr-rate-modal-close').addEventListener('click', () =>
      document.getElementById('pr-rate-modal-overlay').classList.remove('open'));
    document.getElementById('pr-rate-modal-save').addEventListener('click', saveRateSetting);

    document.getElementById('pr-payitem-setting').addEventListener('click', openPayItemSetting);
    document.getElementById('pr-payitem-modal-close').addEventListener('click', () =>
      document.getElementById('pr-payitem-modal-overlay').classList.remove('open'));
    document.getElementById('pr-payitem-add').addEventListener('click', addPayItemCode);
    document.getElementById('pr-payitem-modal-save').addEventListener('click', savePayItemSetting);

    document.getElementById('pr-salary-setting').addEventListener('click', openSalarySetting);
    document.getElementById('pr-salary-modal-close').addEventListener('click', () =>
      document.getElementById('pr-salary-modal-overlay').classList.remove('open'));
    document.getElementById('pr-salary-modal-save').addEventListener('click', saveSalarySetting);

    document.getElementById('pr-preview').addEventListener('click', openPayslip);
    document.getElementById('pr-modal-close').addEventListener('click', () =>
      document.getElementById('pr-modal-overlay').classList.remove('open'));
    document.getElementById('pr-modal-print').addEventListener('click', () => window.print());

    document.getElementById('pr-email-open').addEventListener('click', openEmailModal);
    document.getElementById('pr-email-modal-close').addEventListener('click', () =>
      document.getElementById('pr-email-modal-overlay').classList.remove('open'));
    document.getElementById('pr-email-send').addEventListener('click', sendEmail);

    ['pr-rate-modal-overlay','pr-payitem-modal-overlay','pr-salary-modal-overlay','pr-modal-overlay','pr-email-modal-overlay'].forEach(id => {
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
  window.initPayroll = initPayroll;

})();
