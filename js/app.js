const names = ['인사카드', '인사발령 내역', '근무유형', '일일 출/퇴근 현황', '잔여 연차 현황', '연차/휴가 신청', '유연근무 신청', '초과/휴일근무 신청', '휴/퇴직 신청', '출장 신청/보고', '교육수강내역', 'IP 등록 이력', '이용약관 동의 이력', '급여관리'];
const nav = document.getElementById('submenu');
function showPage(name) { document.querySelectorAll('.submenu button').forEach(b => b.classList.toggle('active', b.textContent.trim().replace('· ', '') === name)); document.getElementById('pageTitle').textContent = name; document.getElementById('payroll').style.display = name === '급여관리' ? 'block' : 'none'; document.getElementById('placeholder').style.display = name === '급여관리' ? 'none' : 'block'; }
names.forEach(n => { const b = document.createElement('button'); b.textContent = '· ' + n; b.addEventListener('click', () => showPage(n)); nav.appendChild(b); });
showPage('급여관리');
document.getElementById('goPayroll').onclick = () => showPage('급여관리');
const yr = document.getElementById('year'), mo = document.getElementById('month');
for (let y = 2024; y <= 2030; y++)
    yr.add(new Option(y + '년', y));
for (let m = 1; m <= 12; m++)
    mo.add(new Option(m + '월', m));
yr.value = '2026';
mo.value = '10';
const ids = ['annual', 'overtimeHours', 'overtimeRate', 'overtimeMultiplier', 'meal', 'allowance', 'pension', 'health', 'care', 'employment', 'tax', 'localTax', 'otherDeduct'];
const initial = Object.fromEntries(ids.map(id => [id, document.getElementById(id).value]));
const val = id => Math.max(0, Number(document.getElementById(id).value) || 0);
const fmt = n => Math.round(n).toLocaleString('ko-KR');
const won = n => fmt(n) + '원';
let result = {};
function calc() { const base = val('annual') / 12, ot = val('overtimeHours') * val('overtimeRate') * val('overtimeMultiplier'), gross = base + ot + val('meal') + val('allowance'), deduct = ['pension', 'health', 'care', 'employment', 'tax', 'localTax', 'otherDeduct'].reduce((a, k) => a + val(k), 0); result = { base, ot, gross, deduct, net: gross - deduct }; [['base', fmt(base)], ['baseRow', won(base)], ['overtimePay', won(ot)], ['gross', won(gross)], ['grossRow', won(gross)], ['deduct', won(deduct)], ['deductRow', won(deduct)], ['net', won(gross - deduct)]].forEach(([id, t]) => document.getElementById(id).textContent = t); }
ids.forEach(id => document.getElementById(id).addEventListener('input', calc));
const key = () => `eip-payroll-${yr.value}-${mo.value}`;
function toast(t) { const el = document.getElementById('toast'); el.textContent = t; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 2500); }
document.getElementById('save').onclick = () => { try {
    localStorage.setItem(key(), JSON.stringify(Object.fromEntries(ids.map(id => [id, document.getElementById(id).value]))));
    toast('선택한 월의 급여정보를 브라우저에 저장했습니다.');
}
catch (e) {
    toast('브라우저 저장이 차단되어 있습니다.');
} };
document.getElementById('load').onclick = () => { let data = null; try {
    data = JSON.parse(localStorage.getItem(key()));
}
catch (e) { } ids.forEach(id => document.getElementById(id).value = data?.[id] ?? initial[id]); calc(); toast(data ? '저장된 급여정보를 불러왔습니다.' : '저장 내역이 없어 기본값을 표시합니다.'); };
document.getElementById('reset').onclick = () => { ids.forEach(id => document.getElementById(id).value = initial[id]); calc(); toast('입력값을 초기화했습니다. 저장된 값은 유지됩니다.'); };
document.getElementById('csv').onclick = () => { calc(); const rows = [['기준월', `${yr.value}-${mo.value.padStart(2, '0')}`], ['사원번호', '101002024012'], ['성명', '조경윤'], ...ids.map(id => [document.querySelector(`label[for="${id}"]`)?.textContent || id, document.getElementById(id).value]), ['기본 월급', result.base], ['초과근무수당', result.ot], ['지급총액', result.gross], ['공제총액', result.deduct], ['실수령액', result.net]]; const csv = '\ufeff' + rows.map(r => r.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `급여관리_${yr.value}${mo.value.padStart(2, '0')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
calc();
