const STORAGE_KEY = "budgetList";

const projectData = {

    "맞춤형 급식관리": {
	"대상별 급식관리": ["식단지원기능강화","위생·영양·안전"],
        "특성화지원": ["지역센터 특성화"],
	"교육자료 지원": ["교육자료 지원"]
	},

	"급식관리 지원사업": {
		"어린이 · 사회복지 통합 운영": ["사회복지 설치 지원","지역센터 통합 관리","소규모 지역센터","정보관리시스템"],
		"전문가 양성": ["전문가 양성"],
		"협력 네트워크 확대": ["권역별 운영","돌봄인력급식"]
	},

	"식생활 개선 연구": {
		"정책 개발 지원": ["정책 개발 지원"],
		"교육 · 홍보 내실화": ["건강 식생활 홍보", "쑥쑥크는 부모 학교"]
	},

	"인건비": {
		"인건비": ["인건비"]
	},

	"기관운영비": {
		"운영비": ["운영비"]
	}
};



const categoryData = {

    "인건비": [
        "급여",
        "제수당"
    ],

    "운영비": [
        "전산운영비",
        "유지보수비"
    ],

    "여비": [
        "국내여비",
        "국외여비"
    ],

    "업무추진비": [
        "기관업무추진비"
    ],

    "유형자산": [
        "전산장비"
    ]
};
let editId = null;
document.addEventListener("DOMContentLoaded", () => {

    initYear();
    initProject();
    initCategory();
    loadBudget();

    document
        .getElementById("majorProject")
        .addEventListener("change", loadMiddle);

    document
        .getElementById("middleProject")
        .addEventListener("change", loadMinor);

    document
        .getElementById("category")
        .addEventListener("change", loadSubCategory);

    document
        .getElementById("amount")
        .addEventListener("input", formatAmount);

    document
        .getElementById("saveBtn")
        .addEventListener("click", saveBudget);
});

function initYear(){

    const select =
        document.getElementById("year");

    const currentYear =
        new Date().getFullYear();

    for(let i=-2;i<=3;i++){

        const year = currentYear+i;

        select.innerHTML +=
            `<option value="${year}">
                ${year}
            </option>`;
    }
}

function initProject(){

    const select =
        document.getElementById("majorProject");

    select.innerHTML =
        '<option value="">구분</option>';

    Object.keys(projectData)
        .forEach(item => {

            select.innerHTML +=
                `<option value="${item}">
                    ${item}
                </option>`;
        });
}

function loadMiddle(){

    const major =
        document.getElementById("majorProject").value;

    const middle =
        document.getElementById("middleProject");

    middle.innerHTML =
        '<option value="">주요사업</option>';

    document.getElementById("minorProject").innerHTML =
        '<option value="">세부사업</option>';

    if(!major) return;

    Object.keys(projectData[major])
        .forEach(item => {

            middle.innerHTML +=
                `<option value="${item}">
                    ${item}
                </option>`;
        });
}

function loadMinor(){

    const major =
        document.getElementById("majorProject").value;

    const middle =
        document.getElementById("middleProject").value;

    const minor =
        document.getElementById("minorProject");

    minor.innerHTML =
        '<option value="">세부사업</option>';

    if(!middle) return;

    projectData[major][middle]
        .forEach(item => {

            minor.innerHTML +=
                `<option value="${item}">
                    ${item}
                </option>`;
        });
}

function initCategory(){

    const select =
        document.getElementById("category");

    select.innerHTML =
        '<option value="">보조비목 선택</option>';

    Object.keys(categoryData)
        .forEach(item => {

            select.innerHTML +=
                `<option value="${item}">
                    ${item}
                </option>`;
        });
}

function loadSubCategory(){

    const category =
        document.getElementById("category").value;

    const sub =
        document.getElementById("subCategory");

    sub.innerHTML =
        '<option value="">보조세목 선택</option>';

    if(!category) return;

    categoryData[category]
        .forEach(item => {

            sub.innerHTML +=
                `<option value="${item}">
                    ${item}
                </option>`;
        });
}

function formatAmount(e){

    let value =
        e.target.value.replace(/[^0-9]/g,'');

    if(!value){ 
        e.target.value = '';
        return;
    }

    e.target.value =
        Number(value).toLocaleString();
}

function saveBudget(){

    const budget = {

        id: Date.now(),

        year:
            document.getElementById("year").value,

        majorProject:
            document.getElementById("majorProject").value,

        middleProject:
            document.getElementById("middleProject").value,

        minorProject:
            document.getElementById("minorProject").value,

        category:
            document.getElementById("category").value,

        subCategory:
            document.getElementById("subCategory").value,

        amount:
            Number(
                document
                    .getElementById("amount")
                    .value
                    .replace(/,/g,'')
            )
    };

    let list =
        JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || [];

if(editId){

    const index =
        list.findIndex(
            item => item.id === editId
        );

    budget.id = editId;

    list[index] = budget;

    editId = null;

    document.getElementById("saveBtn").textContent =
        "저장";

}else{

    list.push(budget);

}
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(list)
    );

    loadBudget();
}

function loadBudget(){

    const list =
        JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || [];

    let html = '';

    list.forEach(item => {

        html += `
        <tr>
            <td>${item.year}</td>
            <td>${item.majorProject}</td>
            <td>${item.middleProject}</td>
            <td>${item.minorProject}</td>
            <td>${item.category}</td>
            <td>${item.subCategory}</td>
            <td>${item.amount.toLocaleString()}원</td>
	    <td>
        	<button
	            class="edit-btn"
	            onclick="editBudget(${item.id})">
        	    수정
	        </button>
	    </td>
            <td>
                <button
                    class="delete-btn"
                    onclick="deleteBudget(${item.id})">
                    삭제
                </button>
            </td>
        </tr>
        `;
    });

    document.getElementById("budgetBody").innerHTML = html;
}

//수정
function editBudget(id){

    const list =
        JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || [];

    const item =
        list.find(x => x.id === id);

    if(!item) return;

    editId = id;

    document.getElementById("year").value =
        item.year;

    document.getElementById("majorProject").value =
        item.majorProject;

    loadMiddle();

    document.getElementById("middleProject").value =
        item.middleProject;

    loadMinor();

    document.getElementById("minorProject").value =
        item.minorProject;

    document.getElementById("category").value =
        item.category;

    loadSubCategory();

    document.getElementById("subCategory").value =
        item.subCategory;

    document.getElementById("amount").value =
        item.amount.toLocaleString();

    document.getElementById("saveBtn").textContent =
        "수정";
}

//삭제
function deleteBudget(id){

    let list =
        JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || [];

    list = list.filter(item => item.id !== id);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(list)
    );

    loadBudget();
}


//초기화
function clearForm(){

    document.getElementById("amount").value = "";

    document.getElementById("majorProject").selectedIndex = 0;

    document.getElementById("middleProject").innerHTML =
        '<option value="">주요사업 선택</option>';

    document.getElementById("minorProject").innerHTML =
        '<option value="">세부사업 선택</option>';

    document.getElementById("category").selectedIndex = 0;

    document.getElementById("subCategory").innerHTML =
        '<option value="">보조세목 선택</option>';
}
clearForm();