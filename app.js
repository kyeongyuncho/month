/*
========================================
Firebase
========================================
*/

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    collection,
    query,
    orderBy,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/*
========================================
Firebase 설정
========================================
*/

import {
    firebaseConfig
} from "./firebase-config.js";


const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);


/*
========================================
행사 설정
========================================
*/

const EVENT_ID =
    "privacy-quiz-2026";


/*
관리자 닉네임

여기에 원하는 단어 추가 가능
*/

const ADMIN_NICKNAMES = [
    "경영기획팀조경윤"
];


/*
관리자 PIN

행사 전에 반드시 변경
*/

const ADMIN_PIN =
    "3923";


/*
========================================
상태
========================================
*/

let currentUser = null;

let myNickname = "";

let myScore = 0;

let currentQuestionIndex = -1;

let quizStatus = "waiting";


/*
========================================
DOM
========================================
*/

const nicknameScreen =
    document.getElementById(
        "nicknameScreen"
    );

const waitingScreen =
    document.getElementById(
        "waitingScreen"
    );

const quizScreen =
    document.getElementById(
        "quizScreen"
    );

const resultScreen =
    document.getElementById(
        "resultScreen"
    );


/*
========================================
화면 전환
========================================
*/

function showScreen(screen) {

    [
        nicknameScreen,
        waitingScreen,
        quizScreen,
        resultScreen
    ].forEach(
        element => {

            element.classList.add(
                "hidden"
            );

        }
    );


    screen.classList.remove(
        "hidden"
    );

}


/*
========================================
Firebase 로그인
========================================
*/

let authReady = null;

authReady = signInAnonymously(auth)
    .then((result) => {
        currentUser = result.user;
        console.log("Firebase 익명 로그인 성공:", currentUser.uid);
        return currentUser;
    })
    .catch((error) => {
        console.error("Firebase 익명 로그인 실패:", error);

        alert(
            "Firebase 연결에 실패했습니다.\n\n" +
            "Firebase Console의 익명 로그인 및\n" +
            "Authorized domains 설정을 확인해주세요."
        );

        throw error;
    });


onAuthStateChanged(
    auth,
    user => {

        if (!user) return;

        currentUser =
            user;

    }
);


/*
========================================
닉네임 입력
========================================
*/

document
    .getElementById(
        "nicknameButton"
    )
    .addEventListener(
        "click",
        enterQuiz
    );


document
    .getElementById(
        "nicknameInput"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                enterQuiz();

            }

        }
    );


async function enterQuiz() {

    const input =
        document.getElementById(
            "nicknameInput"
        );


    const nickname =
        input.value.trim();


    if (!nickname) {

        alert(
            "닉네임을 입력해주세요."
        );

        input.focus();

        return;

    }


    if (
        nickname.length < 2
    ) {

        alert(
            "닉네임은 2글자 이상 입력해주세요."
        );

        return;

    }


    /*
    관리자 여부 확인
    */

    if (
        ADMIN_NICKNAMES.includes(
            nickname
        )
    ) {

        const pin =
            prompt(
                "관리자 PIN을 입력해주세요."
            );


        if (
            pin !== ADMIN_PIN
        ) {

            alert(
                "관리자 PIN이 올바르지 않습니다."
            );

            return;

        }


        /*
        관리자 페이지 이동
        */

        location.href =
            "./admin.html";

        return;

    }


    myNickname =
        nickname;


    await waitForAuth();


    /*
    참가자 등록
    */

    const participantRef =
        doc(
            db,
            "events",
            EVENT_ID,
            "participants",
            currentUser.uid
        );


    const existing =
        await getDoc(
            participantRef
        );


    if (!existing.exists()) {

        await setDoc(
            participantRef,
            {

                uid:
                    currentUser.uid,

                nickname:
                    myNickname,

                totalScore:
                    0,

                createdAt:
                    serverTimestamp(),

                lastActiveAt:
                    serverTimestamp()

            }
        );

    }


    else {

        await updateDoc(
            participantRef,
            {

                nickname:
                    myNickname,

                lastActiveAt:
                    serverTimestamp()

            }
        );

    }


    document
        .getElementById(
            "waitingNickname"
        )
        .textContent =
        myNickname;


    document
        .getElementById(
            "myNickname"
        )
        .textContent =
        myNickname;


    showScreen(
        waitingScreen
    );


    listenQuizState();

    listenRanking();

}


/*
========================================
Auth 대기
========================================
*/

async function waitForAuth() {

    if (currentUser) {
        return currentUser;
    }

    if (authReady) {
        return await authReady;
    }

    throw new Error("Firebase 인증이 준비되지 않았습니다.");
}


/*
========================================
문제 진행 상태 감시
========================================
*/

function listenQuizState() {

    const eventRef =
        doc(
            db,
            "events",
            EVENT_ID
        );


    onSnapshot(
        eventRef,
        snapshot => {

            if (!snapshot.exists()) {

                return;

            }


            const data =
                snapshot.data();


            quizStatus =
                data.status ||
                "waiting";


            const newQuestion =
                data.currentQuestion;


            /*
            종료
            */

            if (
                quizStatus ===
                "finished"
            ) {

                showFinalResult();

                return;

            }


            /*
            일시정지 / 대기
            */

            if (
                quizStatus ===
                "waiting" ||
                quizStatus ===
                "paused"
            ) {

                showScreen(
                    waitingScreen
                );

                return;

            }


            /*
            진행 중
            */

            if (
                quizStatus ===
                "running"
            ) {

                if (
                    typeof newQuestion !==
                    "number"
                ) {

                    return;

                }


                /*
            관리자가 다음/이전 문제로 이동하면
            직전 문제의 정답을 퍼즐에 공개
            */
            if (
                currentQuestionIndex !== -1 &&
                currentQuestionIndex !== newQuestion
            ) {

                const puzzle =
                    window.getPuzzle();

                const previousWord =
                    puzzle.words[currentQuestionIndex];

                if (previousWord) {

                    window.fillPuzzleAnswer(
                        previousWord,
                        previousWord.answer
                    );

                }

            }


            currentQuestionIndex =
                    newQuestion;


                showScreen(
                    quizScreen
                );


                loadQuestion(
                    currentQuestionIndex
                );

            }

        }
    );

}


/*
========================================
현재 문제 표시
========================================
*/

function loadQuestion(
    index
) {

    const puzzle =
        window.getPuzzle();


    const word =
        puzzle.words[index];


    if (!word) return;


    document
        .getElementById(
            "currentQuestionLabel"
        )
        .textContent =
        `${index + 1} / ${puzzle.words.length}`;


    /*
    해당 문제를 직접 선택

    시작 칸이 다른 단어와 교차하는 경우
    단순히 cell.click()을 하면 반대 방향 단어가
    선택될 수 있으므로 wordIndex를 직접 지정한다.
    */

    if (
        typeof window.selectPuzzleWord ===
        "function"
    ) {

        window.selectPuzzleWord(index);

    }

    else {

        const cell =
            document.querySelector(
                `.puzzle-cell[data-row="${word.row - 1}"][data-col="${word.col - 1}"]`
            );

        if (cell) {
            cell.click();
        }

    }

}


/*
========================================
답안 제출
========================================
*/

window.recordAnswer =
    async function(
        wordIndex,
        answer
    ) {

        if (
            !currentUser
        ) {

            return;

        }


        if (
            quizStatus !==
            "running"
        ) {

            alert(
                "현재 문제를 입력할 수 없습니다."
            );

            return;

        }


        /*
        현재 문제와 다른 문제를
        제출하지 못하도록 방지
        */

        if (
            wordIndex !==
            currentQuestionIndex
        ) {

            alert(
                "현재 진행 중인 문제만 입력할 수 있습니다."
            );

            return;

        }


        const puzzle =
            window.getPuzzle();


        const word =
            puzzle.words[wordIndex];


        const normalized =
            answer
                .replace(/\s/g, "")
                .trim();


        const correct =
            normalized ===
            word.answer;


        /*
        답안 기록 ID
        */

        /*
        답안 제출 횟수 확인
        최대 3회까지 입력 가능
        */

        let attempt = 0;
        let submissionRef = null;
        let hasCorrectAnswer = false;

        for (let i = 1; i <= 3; i++) {

            const candidateRef =
                doc(
                    db,
                    "events",
                    EVENT_ID,
                    "submissions",
                    `${currentUser.uid}_${wordIndex}_${i}`
                );

            const candidate =
                await getDoc(candidateRef);

            if (candidate.exists()) {

                if (candidate.data().correct) {
                    hasCorrectAnswer = true;
                    break;
                }

                attempt = i;
                continue;
            }

            attempt = i;
            submissionRef = candidateRef;
            break;
        }

        if (hasCorrectAnswer) {

            alert(
                "이 문제는 이미 정답 처리되었습니다."
            );

            return;
        }

        if (!submissionRef || attempt > 3) {

            document
                .getElementById(
                    "answerMessage"
                )
                .textContent =
                "❌ 3회 모두 오답입니다. 이 문제는 종료되었습니다.";

            return;
        }


        /*
        오답은 즉시 기록
        */

        if (!correct) {

            await setDoc(
                submissionRef,
                {

                    uid:
                        currentUser.uid,

                    nickname:
                        myNickname,

                    questionIndex:
                        wordIndex,

                    answer:
                        normalized,

                    correct:
                        false,

                    points:
                        0,

                    submittedAt:
                        serverTimestamp()

                }
            );


            const remaining =
                3 - attempt;

            document
                .getElementById(
                    "answerMessage"
                )
                .textContent =
                remaining > 0
                    ? `❌ 오답입니다. (남은 기회 ${remaining}회)`
                    : "❌ 오답입니다. 3회 모두 오답입니다. 이 문제는 종료되었습니다.";


            return;

        }


        /*
        정답 처리
        */

        await processCorrectAnswer(
            submissionRef,
            wordIndex,
            normalized
        );

    };


/*
========================================
정답 처리

트랜잭션으로 선착순 점수 부여
========================================
*/

async function processCorrectAnswer(
    submissionRef,
    wordIndex,
    answer
) {

    const participantRef =
        doc(
            db,
            "events",
            EVENT_ID,
            "participants",
            currentUser.uid
        );


    const questionRef =
        doc(
            db,
            "events",
            EVENT_ID,
            "questions",
            String(wordIndex)
        );


    try {

        const result =
            await runTransaction(
                db,
                async transaction => {

                    /*
                    이미 제출했는지
                    */

                    const submission =
                        await transaction.get(
                            submissionRef
                        );


                    if (
                        submission.exists()
                    ) {

                        return {
                            already: true,
                            points: 0
                        };

                    }


                    /*
                    문제 기록
                    */

                    const questionSnapshot =
                        await transaction.get(
                            questionRef
                        );

                    const participantSnapshot =
                        await transaction.get(
                            participantRef
                        );    

                    let ranking = [];


                    if (
                        questionSnapshot.exists()
                    ) {

                        ranking =
                            questionSnapshot
                                .data()
                                .ranking ||
                            [];

                    }


                    if (ranking.includes(currentUser.uid)) {

                        return {
                            already: true,
                            points: 0
                        };

                    }


                    /*
                    선착순 순위
                    */

                    const rank =
                        ranking.length + 1;


                    /*
                    10, 9, 8 ... 1점
                    */

                    const points =
                        Math.max(
                            10 - (rank - 1),
                            1
                        );

                    const currentScore =
                         participantSnapshot.exists()
                            ? participantSnapshot.data().totalScore || 0
                            : 0;
                    /*
                    제출 기록
                    */

                    transaction.set(
                        submissionRef,
                        {

                            uid:
                                currentUser.uid,

                            nickname:
                                myNickname,

                            questionIndex:
                                wordIndex,

                            answer,

                            correct:
                                true,

                            points,

                            rank,

                            submittedAt:
                                serverTimestamp()

                        }
                    );


                    /*
                    문제별 정답 순서
                    */

                    transaction.set(
                        questionRef,
                        {

                            ranking: [
                                ...ranking,
                                currentUser.uid
                            ]

                        },
                        {
                            merge:
                                true
                        }
                    );


                    /*
                    참가자 점수 증가
                    */

                    transaction.update(
                        participantRef,
                        {

                            totalScore:
                                currentScore +
                                points,

                            lastActiveAt:
                                serverTimestamp()

                        }
                    );


                    return {
                        already: false,
                        points,
                        rank
                    };

                }
            );


        if (
            result.already
        ) {

            alert(
                "이미 제출한 답안입니다."
            );

            return;

        }


        /*
        퍼즐에 정답 표시
        */

        const puzzle =
            window.getPuzzle();


        const word =
            puzzle.words[wordIndex];


        window.fillPuzzleAnswer(
            word,
            answer
        );


        document
            .getElementById(
                "answerMessage"
            )
            .textContent =
            `🎉 정답입니다! +${result.points}점`;


        showCorrectModal(
            result.points,
            result.rank
        );


    }

    catch (error) {

        console.error(
            error
        );


        alert(
            "답안 처리 중 오류가 발생했습니다."
        );

    }

}


/*
========================================
실시간 순위
========================================
*/

function listenRanking() {

    const participantsRef =
        collection(
            db,
            "events",
            EVENT_ID,
            "participants"
        );


    const rankingQuery =
        query(
            participantsRef,
            orderBy(
                "totalScore",
                "desc"
            )
        );


    onSnapshot(
        rankingQuery,
        snapshot => {

            const participants =
                [];


            snapshot.forEach(
                docSnapshot => {

                    participants.push(
                        docSnapshot.data()
                    );

                }
            );


            renderRanking(
                participants
            );


            const me =
                participants.find(
                    participant =>
                        participant.uid ===
                        currentUser?.uid
                );


            if (me) {

                myScore =
                    me.totalScore || 0;


                document
                    .getElementById(
                        "myScore"
                    )
                    .textContent =
                    myScore;

            }

        }
    );

}


/*
========================================
TOP 5
========================================
*/

function renderRanking(
    participants
) {

    const container =
        document.getElementById(
            "topRanking"
        );


    if (
        participants.length === 0
    ) {

        container.textContent =
            "-";

        return;

    }


    container.innerHTML =
        participants
            .slice(0, 5)
            .map(
                (participant, index) => `
                    <div class="mini-rank">
                        <span>
                            ${index + 1}.
                            ${escapeHtml(
                                participant.nickname
                            )}
                        </span>

                        <strong>
                            ${participant.totalScore || 0}점
                        </strong>
                    </div>
                `
            )
            .join("");

}


/*
========================================
최종 결과
========================================
*/

async function showFinalResult() {

    showScreen(
        resultScreen
    );


    document
        .getElementById(
            "resultNickname"
        )
        .textContent =
        myNickname;


    document
        .getElementById(
            "resultScore"
        )
        .textContent =
        myScore;


    const participantsRef =
        collection(
            db,
            "events",
            EVENT_ID,
            "participants"
        );


    const rankingQuery =
        query(
            participantsRef,
            orderBy(
                "totalScore",
                "desc"
            )
        );


    onSnapshot(
        rankingQuery,
        snapshot => {

            const participants =
                [];


            snapshot.forEach(
                item => {

                    participants.push(
                        item.data()
                    );

                }
            );


            const myRank =
                participants.findIndex(
                    participant =>
                        participant.uid ===
                        currentUser.uid
                ) + 1;


            document
                .getElementById(
                    "resultRank"
                )
                .textContent =
                myRank;


            document
                .getElementById(
                    "finalRanking"
                )
                .innerHTML =
                participants
                    .map(
                        (participant, index) => `
                            <div class="final-rank-row ${
                                participant.uid === currentUser.uid
                                    ? "me"
                                    : ""
                            }">
                                <span class="rank-number">
                                    ${index + 1}위
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        participant.nickname
                                    )}
                                </strong>

                                <b>
                                    ${participant.totalScore || 0}점
                                </b>
                            </div>
                        `
                    )
                    .join("");

        }
    );

}


/*
========================================
정답 팝업
========================================
*/

function showCorrectModal(points, rank) {

    const modal =
        document.getElementById("correctModal");

    if (!modal) return;

    document.getElementById("correctScore").textContent =
        `+${points}점 획득`;

    document.getElementById("correctRank").textContent =
        `현재 ${rank}등`;

    modal.classList.remove("hidden");

    document.body.classList.add("modal-open");

}

function closeCorrectModal() {

    const modal =
        document.getElementById("correctModal");

    if (!modal) return;

    modal.classList.add("hidden");

    document.body.classList.remove("modal-open");

}

const correctModalClose =
    document.getElementById("correctModalClose");

if (correctModalClose) {

    correctModalClose.addEventListener(
        "click",
        closeCorrectModal
    );

}

const correctModal =
    document.getElementById("correctModal");

if (correctModal) {

    correctModal.addEventListener(
        "click",
        event => {

            if (event.target === correctModal) {
                closeCorrectModal();
            }

        }
    );

}

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            closeCorrectModal();
        }

    }
);


/*
========================================
HTML 안전처리
========================================
*/

function escapeHtml(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}