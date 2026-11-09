const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
const clouds = document.querySelector('.clouds');
const gameBoard = document.getElementById('gameBoard');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const changeJumpKeyButton = document.getElementById('changeJumpKeyButton');
const restoreJumpKeysButton = document.getElementById('restoreJumpKeysButton');
const jumpKeyLabel = document.getElementById('jumpKeyLabel');
const keyCaptureStatus = document.getElementById('keyCaptureStatus');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const timerElement = document.getElementById('timer');
const gameOver = document.getElementById('gameOver');
const finalScoreE = document.getElementById('finalScore');
const finalPipesE = document.getElementById('finalPipes');
const finalTimeE = document.getElementById('finalTime');
const newRecordE = document.getElementById('newRecord');

const POINTS_PER_PIPE = 10; // Pontos ganhos a cada cano pulado
const HIGH_SCORE_KEY = 'marioHighScore'; // Chave usada no localStorage

let loopId = null; // ID do requestAnimationFrame do loop principal
let timerInterval = null;

let score = 0;
let pipesJumped = 0;
let highScore = 0;
let timeSec = 0;
let pipeScored = false; // Garante que cada cano só pontue uma vez
let isGameOver = false;
let isGameStarted = false;
const defaultJumpKeys = ['Space', 'ArrowUp']; // Teclas padrão para pular
let jumpKeys = [...defaultJumpKeys]; // Teclas escolhidas pelo jogador para pular
let isChoosingJumpKey = false; // Indica se o jogador está escolhendo uma nova tecla

// Recorde salvo no navegador (com proteção caso o localStorage esteja indisponível)
const loadHighScore = () => {
    try {
        highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch (e) {
        highScore = 0;
    }
    highScoreElement.textContent = highScore;
};

const saveHighScore = () => {
    try {
        localStorage.setItem(HIGH_SCORE_KEY, highScore);
    } catch (e) {
        // Sem localStorage: o recorde vale apenas enquanto a página estiver aberta
    }
};

const formatJumpKey = (code) => { // Formata o nome da tecla para exibição
    const keyNames = {
        Space: 'Espaço',
        ArrowUp: 'Seta para cima',
        ArrowDown: 'Seta para baixo',
        ArrowLeft: 'Seta para esquerda',
        ArrowRight: 'Seta para direita'
    };

    if (keyNames[code]) return keyNames[code];
    if (code.startsWith('Key')) return code.slice(3); // Teclas alfabéticas
    if (code.startsWith('Digit')) return code.slice(5); // Teclas numéricas
    return code;
};

const updateJumpKeyLabel = () => { // Atualiza o rótulo com as teclas de pulo atuais
    const labels = jumpKeys.map(formatJumpKey);
    jumpKeyLabel.textContent = `Tecla${labels.length > 1 ? 's' : ''} para pular: ${labels.join(' ou ')}`;
};

// Executa o pulo do Mario
const jump = () => {
    // Não pula se o jogo não começou, se acabou ou se o Mario já está no ar
    if (!isGameStarted || isGameOver || mario.classList.contains('jump')) return;

    mario.classList.add('jump');

    // Remove a classe após a duração da animação (500ms) para permitir um novo pulo
    setTimeout(() => {
        mario.classList.remove('jump');
    }, 500);
};

// Para todos os loops e temporizadores
const stopGame = () => {
    cancelAnimationFrame(loopId);
    clearInterval(timerInterval);
};

// Loop principal: verifica colisão e pontuação a cada frame
const gameLoop = () => {
    const pipePosition = pipe.offsetLeft;
    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

    // Colisão: cano na área do Mario (<= 120px) E Mario abaixo da altura do cano (< 80px)
    if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {

        // Congela o cano na posição da colisão
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        // Trava o Mario na altura em que bateu
        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;

        // Troca o sprite pela imagem de Game Over
        mario.src = './images/game-over.png';
        mario.style.width = '75px';
        mario.style.marginLeft = '50px';

        // Pausa as nuvens
        clouds.style.animation = 'none';

        stopGame();
        isGameOver = true;

        // Verifica se bateu o recorde
        const isNewRecord = score > highScore;
        if (isNewRecord) {
            highScore = score;
            highScoreElement.textContent = highScore;
            saveHighScore();
        }

        // Mostra o modal de Game Over
        finalScoreE.textContent = score;
        finalPipesE.textContent = pipesJumped;
        finalTimeE.textContent = timeSec;
        newRecordE.hidden = !isNewRecord;
        gameOver.style.display = 'flex';
        restartButton.focus();
        return;
    }

    // O cano passou pelo Mario sem colisão: pontua uma única vez
    if (pipePosition <= 0 && !pipeScored) {
        pipeScored = true;
        pipesJumped += 1;
        score += POINTS_PER_PIPE;
        scoreElement.textContent = score;
    }

    // O cano reapareceu na direita: libera a pontuação do próximo
    if (pipePosition > 120) {
        pipeScored = false;
    }

    loopId = requestAnimationFrame(gameLoop);
};

// Inicializa ou reinicia a partida
const start = () => {
    stopGame();

    isGameOver = false;
    isGameStarted = true;
    score = 0;
    pipesJumped = 0;
    timeSec = 0;
    pipeScored = false;

    scoreElement.textContent = '0';
    timerElement.textContent = '0';

    gameOver.style.display = 'none';
    startScreen.style.display = 'none';
    gameBoard.classList.remove('is-idle');

    // Restaura o Mario
    mario.classList.remove('jump');
    mario.src = './images/mario.gif';
    mario.style.width = '150px';
    mario.style.marginLeft = '0px';
    mario.style.bottom = '0px';
    mario.style.animation = '';

    // Reinicia as animações do cano e das nuvens (o reflow força o reinício
    // mesmo na primeira partida, quando a animação já estava rodando)
    pipe.style.animation = 'none';
    clouds.style.animation = 'none';
    void pipe.offsetWidth;
    pipe.style.animation = 'pipe-animation 1.5s infinite linear';
    pipe.style.left = '';
    clouds.style.animation = 'clouds-animation 20s infinite linear';

    // Cronômetro (1 segundo por incremento)
    timerInterval = setInterval(() => {
        timeSec += 1;
        timerElement.textContent = timeSec;
    }, 1000);

    loopId = requestAnimationFrame(gameLoop);
};

startButton.addEventListener('click', start);
restartButton.addEventListener('click', start);

changeJumpKeyButton.addEventListener('click', () => {
    isChoosingJumpKey = true;
    keyCaptureStatus.textContent = 'Pressione a tecla que deseja usar para pular. Pressione Escape para cancelar.';
});

restoreJumpKeysButton.addEventListener('click', () => {
    jumpKeys = [...defaultJumpKeys];
    isChoosingJumpKey = false;
    updateJumpKeyLabel();
    keyCaptureStatus.textContent = 'Teclas padrão restauradas.';
});

document.addEventListener('keydown', (event) => {
    if (isChoosingJumpKey) {
        if (event.code === 'Escape' || event.code === 'Tab') { // Cancela a escolha
            event.preventDefault();
            isChoosingJumpKey = false;
            keyCaptureStatus.textContent = 'Alteração cancelada.';
            return;
        }

        event.preventDefault();

        // Teclas reservadas não podem ser usadas para pular
        if (['Enter', 'Backspace', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(event.code)) {
            keyCaptureStatus.textContent = 'Essa tecla é reservada. Escolha outra tecla para pular.';
            return;
        }

        jumpKeys = [event.code];
        isChoosingJumpKey = false;
        updateJumpKeyLabel();
        keyCaptureStatus.textContent = `${formatJumpKey(event.code)} definida como tecla de pulo.`;
        return;
    }

    if (!isGameStarted || isGameOver) return;

    if (jumpKeys.includes(event.code)) {
        event.preventDefault();
        jump();
    }
});

loadHighScore();