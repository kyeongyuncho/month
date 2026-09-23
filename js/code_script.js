const PROJECT_KEY = "projectCodes";

loadProjectCodes();

function saveProjectCode(){

    const majorName =
        document.getElementById("majorName").value.trim();

    const middleName =
        document.getElementById("middleName").value.trim();

    const minorName =
        document.getElementById("minorName").value.trim();

    if(
        !majorName ||
        !middleName ||
        !minorName
    ){
        alert("모든 항목을 입력하세요.");
        return;
    }

    const project = {

        id: Date.now(),

        majorName,

        middleName,

        minorName
    };

    let projectCodes =
        JSON.parse(
            localStorage.getItem(PROJECT_KEY)
        ) || [];

    projectCodes.push(project);

    localStorage.setItem(
        PROJECT_KEY,
        JSON.stringify(projectCodes)
    );

    document.getElementById("majorName").value = "";
    document.getElementById("middleName").value = "";
    document.getElementById("minorName").value = "";

    loadProjectCodes();
}

function loadProjectCodes(){

    const projectCodes =
        JSON.parse(
            localStorage.getItem(PROJECT_KEY)
        ) || [];

    let html = "";

    projectCodes.forEach(item => {

        html += `
        <tr>
            <td>${item.majorName}</td>
            <td>${item.middleName}</td>
            <td>${item.minorName}</td>
	    <td>${item.budgetAmount.toLocaleString()}원</td>
            <td>
                <button
                    class="delete-btn"
                    onclick="deleteProjectCode(${item.id})">
                    삭제
                </button>
            </td>
        </tr>
        `;
    });

    document.getElementById(
        "projectBody"
    ).innerHTML = html;
}

function deleteProjectCode(id){

    let projectCodes =
        JSON.parse(
            localStorage.getItem(PROJECT_KEY)
        ) || [];

    projectCodes =
        projectCodes.filter(
            item => item.id !== id
        );

    localStorage.setItem(
        PROJECT_KEY,
        JSON.stringify(projectCodes)
    );

    loadProjectCodes();
}