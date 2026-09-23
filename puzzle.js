const puzzle = {

    rows: 16,
    cols: 14,

    words: [

        {
            number: 1,
            direction: "down",
            row: 2,
            col: 4,
            answer: "개인정보",
            question:
                "살아 있는 개인을 알아볼 수 있는 정보"
        },

        {
            number: 2,
            direction: "across",
            row: 5,
            col: 3,
            answer: "정보주체",
            question:
                "개인정보로 알아볼 수 있는 사람, 정보의 주인을 뜻함"
        },

        {
            number: 3,
            direction: "across",
            row: 2,
            col: 4,
            answer: "개인정보처리자",
            question:
                "업무를 목적으로 개인정보파일을 운용하기 위하여 스스로 또는 다른사람을 통하여 개인정보를 처리하는 공공기관 법인 단체 및 개인 등을 말함"
        },

        {
            number: 4,
            direction: "down",
            row: 6,
            col: 4,
            answer: "취급자",
            question:
                "개인정보처리자의 지휘 감독을 받아 실제로 개인정보를 처리하는 자"
        },

        {
            number: 5,
            direction: "down",
            row: 7,
            col: 7,
            answer: "고유식별정보",
            question:
                "개인을 고유하게 구별하기 위해 부여된 정보는?"
        },

        {
            number: 6,
            direction: "down",
            row: 9,
            col: 9,
            answer: "생명주기",
            question:
                "개인정보를 수집~파기하기까지 거치는 주요 관리 단계"
        },

        {
            number: 7,
            direction: "across",
            row: 8,
            col: 11,
            answer: "동의",
            question:
                "개인정보를 수집 이용할 때 정보주체에게 처리 목적 등을 알리고 적법하게 처리하는 위한 대표적인 근거는?"
        },

        {
            number: 8,
            direction: "down",
            row: 10,
            col: 11,
            answer: "최소수집",
            question:
                "개인정보를 처리할 때 업무에 필요한 범위 내에서 꼭 필요한 정보만 수집해야 한다는 원칙은?"
        },

        {
            number: 9,
            direction: "down",
            row: 4,
            col: 8,
            answer: "비밀유지",
            question:
                "개인정보보호법에 따라 업무상 알게 된 개인정보를 다른 사람에게 누설하거나 부당한 목적으로 쓰지 않아야 하는 법적 의무"
        },

        {
            number: 10,
            direction: "across",
            row: 6,
            col: 8,
            answer: "유출",
            question:
                "개인정보가 정당한 권한 없이 외부로 공개되거나 제공되는 사고를 무엇이라고 하는가?"
        },

        {
            number: 11,
            direction: "across",
            row: 14,
            col: 9,
            answer: "파기",
            question:
                "개인정보를 처리한 목적이 달성되어 더 이상 보유할 필요가 없을 때 이를 없애는 행위는?"
        },

        {
            number: 12,
            direction: "down",
            row: 12,
            col: 7,
            answer: "보유기간",
            question:
                "개인정보를 일정기간 보관한 후 파기하는 기준이 되는 기간은?"
        },

        {
            number: 13,
            direction: "down",
            row: 14,
            col: 9,
            answer: "파쇄",
            question:
                "개인정보가 포함된 문서를 더 이상 복구할 수 없도록 잘게 파기하는 방법은?"
        },

        {
            number: 14,
            direction: "across",
            row: 15,
            col: 3,
            answer: "피싱",
            question:
                "신뢰할 수 있는 기관이나 사람으로 위장하여 사용자를 속이는 사이버 범죄 행위"
        },

        {
            number: 15,
            direction: "down",
            row: 13,
            col: 4,
            answer: "스미싱",
            question:
                "문자(SMS)와 피싱의 합성어로, 악성 앱 주소나 링크가 포함된 문자를 전송하는 사기 수법"
        },

        {
            number: 16,
            direction: "across",
            row: 4,
            col: 8,
            answer: "비밀번호",
            question:
                "이용자가 시스템에 대한 접근권한을 가지고 있음을 증명하는 암호 문자는?"
        },

        {
            number: 17,
            direction: "across",
            row: 10,
            col: 2,
            answer: "접근권한",
            question:
                "개인정보에 접근할 수 있는 사람이나 시스템의 범위를 업무상 필요한 수준으로 제한하는 것은?"
        },

        {
            number: 18,
            direction: "down",
            row: 10,
            col: 2,
            answer: "접근통제",
            question:
                "개인정보를 업무상 필요 이상으로 열람하거나 조회하지 못하도록 하는 원칙은?"
        },

        {
            number: 19,
            direction: "across",
            row: 12,
            col: 11,
            answer: "수탁자",
            question:
                "개인정보 처리 업무의 일부를 다른 업체에 맡기는 경우 해당 업체를 법에서 무엇이라고 하는가?"
        },

        {
            number: 20,
            direction: "across",
            row: 12,
            col: 5,
            answer: "화면보호기",
            question:
                "PC를 사용하지 않을 때 화면을 자동으로 잠가 타인의 접근을 막는 기능은?(윈도우 + L)"
        }







    ]

};


/*
========================================
퍼즐 화면/동작
========================================
*/

const grid =
    document.getElementById("puzzleGrid");

const questionNumber =
    document.getElementById("questionNumber");

const questionText =
    document.getElementById("questionText");

const answerInput =
    document.getElementById("answerInput");

const answerButton =
    document.getElementById("answerButton");

const answerMessage =
    document.getElementById("answerMessage");


const cells = {};

let selectedWordIndex = null;

let selectedDirection = null;


/*
========================================
좌표 Key
========================================
*/

function getKey(row, col) {

    return `${row}-${col}`;

}


/*
========================================
퍼즐 데이터 생성
========================================
*/

function makePuzzle() {

    Object.keys(cells).forEach(
        key => delete cells[key]
    );


    puzzle.words.forEach(
        (word, wordIndex) => {

            const answer =
                [...word.answer];


            answer.forEach(
                (letter, index) => {

                    let row =
                        word.row - 1;

                    let col =
                        word.col - 1;


                    if (
                        word.direction === "down"
                    ) {

                        row += index;

                    }


                    if (
                        word.direction === "across"
                    ) {

                        col += index;

                    }


                    const key =
                        getKey(row, col);


                    if (!cells[key]) {

                        cells[key] = {

                            row,
                            col,

                            letter,

                            words: []

                        };

                    }


                    /*
                    교차점 처리
                    */

                    if (
                        cells[key].letter !==
                        letter
                    ) {

                        console.error(
                            "교차 문자 불일치:",
                            key,
                            cells[key].letter,
                            letter
                        );

                    }


                    if (
                        !cells[key].words.includes(
                            wordIndex
                        )
                    ) {

                        cells[key].words.push(
                            wordIndex
                        );

                    }

                }

            );

        }

    );

}


/*
========================================
그리드 그리기
========================================
*/

function drawGrid() {

    grid.innerHTML = "";


    grid.style.gridTemplateColumns =
        `repeat(${puzzle.cols}, 1fr)`;


    for (
        let row = 0;
        row < puzzle.rows;
        row++
    ) {

        for (
            let col = 0;
            col < puzzle.cols;
            col++
        ) {

            const cell =
                document.createElement("div");


            cell.classList.add(
                "puzzle-cell"
            );


            const key =
                getKey(row, col);


            const data =
                cells[key];


            if (!data) {

                cell.classList.add("block");

            }


            else {

                cell.classList.add("active");


                cell.dataset.row =
                    row;

                cell.dataset.col =
                    col;


                /*
                시작번호 표시
                */

                const startWords =
                    puzzle.words.filter(
                        word =>
                            word.row - 1 === row &&
                            word.col - 1 === col
                    );


                if (
                    startWords.length > 0
                ) {

                    const number =
                        document.createElement(
                            "span"
                        );


                    number.classList.add(
                        "cell-number"
                    );


                    number.textContent =
                        startWords
                            .map(word => word.number)
                            .join("/");


                    cell.appendChild(number);

                }


                cell.addEventListener(
                    "click",
                    () => {

                        selectCell(data);

                    }
                );

            }


            grid.appendChild(cell);

        }

    }

}


/*
========================================
칸 선택

교차점이면
가로 → 세로 → 가로
토글
========================================
*/

function selectCell(data) {

    let wordIndex;


    if (
        data.words.length === 1
    ) {

        wordIndex =
            data.words[0];

    }


    else {

        /*
        교차점에서는 현재 방향과 반대되는 단어를 선택
        */

        const otherWord =
            data.words.find(
                index =>
                    puzzle.words[index].direction !==
                    selectedDirection
            );

        wordIndex =
            otherWord ??
            data.words[0];

    }


    selectWord(wordIndex, data);

}


/*
관리자에서 특정 문제를 강제로 선택할 때 사용
교차점의 방향 토글에 영향을 받지 않는다.
*/
function selectWord(wordIndex) {

    const word =
        puzzle.words[wordIndex];

    if (!word) return;


    const data =
        cells[getKey(word.row - 1, word.col - 1)];

    selectWordInternal(wordIndex, data);

}


function selectWordInternal(wordIndex, data) {

    selectedWordIndex =
        wordIndex;


    const word =
        puzzle.words[wordIndex];


    selectedDirection =
        word.direction;


    document
        .querySelectorAll(
            ".puzzle-cell"
        )
        .forEach(
            cell => {

                cell.classList.remove(
                    "selected",
                    "word-selected"
                );

            }
        );


    questionNumber.textContent =
        `${word.direction === "across" ? "가로" : "세로"} ${word.number}번`;


    questionText.textContent =
        word.question;


    highlightWord(word);


    if (data) {

        const selectedCell =
            document.querySelector(
                `.puzzle-cell[data-row="${data.row}"][data-col="${data.col}"]`
            );

        if (selectedCell) {
            selectedCell.classList.add("selected");
        }

    }


    answerInput.value = "";

    answerMessage.textContent = "";

    answerInput.focus();

}


window.selectPuzzleWord =
    selectWord;


/*
========================================
단어 강조
========================================
*/

function highlightWord(word) {

    const length =
        [...word.answer].length;


    for (
        let i = 0;
        i < length;
        i++
    ) {

        let row =
            word.row - 1;

        let col =
            word.col - 1;


        if (
            word.direction === "across"
        ) {

            col += i;

        }


        if (
            word.direction === "down"
        ) {

            row += i;

        }


        const cell =
            document.querySelector(
                `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
            );


        if (cell) {

            cell.classList.add(
                "word-selected"
            );

        }

    }

}


/*
========================================
정답 입력
========================================
*/

answerButton.addEventListener(
    "click",
    submitAnswer
);


answerInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            submitAnswer();

        }

    }
);


function submitAnswer() {

    if (
        selectedWordIndex === null
    ) {

        alert(
            "먼저 퍼즐에서 문제를 선택해주세요."
        );

        return;

    }


    const word =
        puzzle.words[selectedWordIndex];


    const answer =
        answerInput.value.trim();


    if (!answer) {

        alert(
            "정답을 입력해주세요."
        );

        answerInput.focus();

        return;

    }


    /*
    실제 입력값 기록
    */

    if (
        typeof window.recordAnswer ===
        "function"
    ) {

        window.recordAnswer(
            selectedWordIndex,
            answer
        );

    }

}


/*
========================================
정답을 퍼즐에 표시
========================================
*/

function fillAnswer(
    word,
    answer
) {

    const letters =
        [...answer];


    letters.forEach(
        (letter, index) => {

            let row =
                word.row - 1;

            let col =
                word.col - 1;


            if (
                word.direction === "across"
            ) {

                col += index;

            }


            if (
                word.direction === "down"
            ) {

                row += index;

            }


            const cell =
                document.querySelector(
                    `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
                );


            if (!cell) return;


            let letterElement =
                cell.querySelector(
                    ".cell-letter"
                );


            if (!letterElement) {

                letterElement =
                    document.createElement(
                        "span"
                    );


                letterElement.classList.add(
                    "cell-letter"
                );


                cell.appendChild(
                    letterElement
                );

            }


            letterElement.textContent =
                letter;

        }
    );

}


/*
외부에서 사용할 수 있도록 등록
*/

window.fillPuzzleAnswer =
    fillAnswer;


window.getPuzzle =
    () => puzzle;


makePuzzle();
drawGrid();