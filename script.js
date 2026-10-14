const WORDS = [
  "AMIGO", "ARROZ", "AVIAO", "BAILE", "BANCO",
  "BARCO", "BEBER", "BOLSA", "BRISA", "CAMPO",
  "CANAL", "CARNE", "CARTA", "CASAL", "CHAVE",
  "CHUVA", "CINCO", "CIRCO", "CLIMA", "COBRA",
  "CORPO", "CORTE", "CRIME", "CULTO", "DANCA",
  "DEDOS", "DENTE", "DESEN", "DOIDO", "DOLAR",
  "DORME", "FALAR", "FAROL", "FESTA", "FILHO",
  "FLORA", "FOGOS", "FORMA", "FORTE", "FRASE",
  "FRUTA", "FUGIR", "GATOS", "GENTE", "GRAMA",
  "GRITO", "HONRA", "HOTEL", "IGUAL", "JOGAR",
  "JOVEM", "JUROS", "LAPIS", "LARGO", "LEITE",
  "LIMAO", "LIMPO", "LIVRO", "LUGAR", "MAGIA",
  "MANGA", "MARCA", "MEDOS", "MELAO", "MENOR",
  "MESAS", "METAL", "MEXER", "MILHO", "MISTO",
  "MODAS", "MOLHO", "MONTE", "MORAL", "MORRO",
  "MORTE", "MOTOR", "MUDAR", "MUNDO", "NADAR",
  "NAVIO", "NOBRE", "NOITE", "NORTE", "NUVEM",
  "OLHAR", "OMBRO", "ONTEM", "ORDEM", "PADRE",
  "PAGAR", "PALCO", "PAPEL", "PARAR", "PARTE",
  "PASTA", "PEDRA", "PEIXE", "PERDA", "PERTO",
  "PIANO", "PILHA", "PINTA", "PODER", "PONTO",
  "PORTA", "PRAIA", "PRATO", "PRECO", "PRESA",
  "PRETO", "PRIMO", "PROVA", "QUASE", "QUEDA",
  "RAIVA", "RAMOS", "RAZAO", "REGRA", "RESTO",
  "RISCO", "RITMO", "ROUPA", "SABER", "SABOR",
  "SALTO", "SAUDE", "SELOS", "SENHA", "SENSO",
  "SINAL", "SITIO", "SOBRE", "SONHO", "SORTE",
  "SUAVE", "SUJAR", "TARDE", "TEMPO", "TERRA",
  "TESTE", "TIGRE", "TINTA", "TODOS", "TORRE",
  "TRATO", "TREVO", "TROCA", "TURMA", "VAGAS",
  "VALOR", "VAPOR", "VELHO", "VENDA", "VERDE",
  "VIVER", "VOGAL", "VULTO"
];

const MAX_ROWS = 6;
const WORD_LENGTH = 5;

const board = document.querySelector("#board");
const keyboard = document.querySelector("#keyboard");
const message = document.querySelector("#message");
const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modal-title");
const modalBody = document.querySelector("#modal-body");

let answer = "";
let row = 0;
let currentGuess = "";
let finished = false;
let history = [];
let keyStates = {};

function chooseWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function normalizeWord(word) {
  return word.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function createBoard() {
  board.innerHTML = "";

  for (let r = 0; r < MAX_ROWS; r++) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.row = r;
      tile.dataset.col = c;

      if (r === 0) tile.classList.add("active");

      board.appendChild(tile);
    }
  }
}

function renderCurrentGuess() {
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = getTile(row, c);
    tile.textContent = currentGuess[c] || "";
    tile.classList.toggle("filled", Boolean(currentGuess[c]));
  }
}

function getTile(r, c) {
  return board.querySelector(
    `.tile[data-row="${r}"][data-col="${c}"]`
  );
}

function setMessage(text) {
  message.textContent = text;
}

function typeLetter(letter) {
  if (finished || currentGuess.length >= WORD_LENGTH) return;
  if (!/^[A-Z]$/.test(letter)) return;

  currentGuess += letter;
  renderCurrentGuess();
  setMessage("");
}

function deleteLetter() {
  if (finished || currentGuess.length === 0) return;

  currentGuess = currentGuess.slice(0, -1);
  renderCurrentGuess();
}

function evaluateGuess(guess, target) {
  const result = Array(WORD_LENGTH).fill("absent");
  const remaining = target.split("");

  // Primeiro, marca as letras na posição correta.
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      remaining[i] = null;
    }
  }

  // Depois, marca letras certas na posição errada.
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;

    const index = remaining.indexOf(guess[i]);

    if (index !== -1) {
      result[i] = "present";
      remaining[index] = null;
    }
  }

  return result;
}

function updateKeyboard(letter, status) {
  const priority = {
    absent: 1,
    present: 2,
    correct: 3
  };

  if (
    keyStates[letter] &&
    priority[keyStates[letter]] > priority[status]
  ) {
    return;
  }

  keyStates[letter] = status;

  const key = keyboard.querySelector(
    `[data-key="${letter}"]`
  );

  if (!key) return;

  key.classList.remove("correct", "present", "absent");
  key.classList.add(status);
}

function submitGuess() {
  if (finished) return;

  if (currentGuess.length !== WORD_LENGTH) {
    setMessage("Digite uma palavra com 5 letras.");
    return;
  }

  // Esta versão usa uma lista simples de palavras possíveis.
  // Palpites fora da lista são aceitos, desde que tenham 5 letras.
  const guess = normalizeWord(currentGuess);
  const result = evaluateGuess(guess, answer);

  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = getTile(row, c);
    tile.classList.remove("active", "filled");
    tile.classList.add(result[c]);
    updateKeyboard(guess[c], result[c]);
  }

  history.push({
    word: guess,
    result: [...result]
  });

  if (guess === answer) {
    finished = true;
    setMessage("Parabéns! Você acertou! 🎉");
    saveResult(true);
    return;
  }

  row++;
  currentGuess = "";

  if (row >= MAX_ROWS) {
    finished = true;
    setMessage(`Fim de jogo! A palavra era ${answer}.`);
    saveResult(false);
    return;
  }

  getTile(row, 0).classList.add("active");
}

function newGame() {
  answer = chooseWord();
  row = 0;
  currentGuess = "";
  finished = false;
  history = [];
  keyStates = {};

  createBoard();

  keyboard.querySelectorAll(".key").forEach(key => {
    key.classList.remove("correct", "present", "absent");
  });

  setMessage("");
}

function getStats() {
  try {
    return JSON.parse(localStorage.getItem("termo-stats")) || {
      played: 0,
      wins: 0,
      streak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0]
    };
  } catch {
    return {
      played: 0,
      wins: 0,
      streak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0]
    };
  }
}

function saveResult(won) {
  const stats = getStats();

  stats.played++;

  if (won) {
    stats.wins++;
    stats.streak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    stats.distribution[row]++;
  } else {
    stats.streak = 0;
  }

  localStorage.setItem("termo-stats", JSON.stringify(stats));
}

function showModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.showModal();
}

function showHelp() {
  showModal("Como jogar", `
    <p>Adivinhe a palavra de 5 letras em até 6 tentativas.</p>

    <div class="example">
      <span class="correct">A</span>
      <span>M</span><span>I</span><span>G</span><span>O</span>
    </div>
    <p><strong>Verde:</strong> letra correta no lugar certo.</p>

    <div class="example">
      <span>A</span><span class="present">M</span>
      <span>I</span><span>G</span><span>O</span>
    </div>
    <p><strong>Amarelo:</strong> letra presente em outra posição.</p>

    <div class="example">
      <span>A</span><span>M</span><span class="absent">I</span>
      <span>G</span><span>O</span>
    </div>
    <p><strong>Cinza:</strong> letra que não aparece na palavra.</p>
    <p>Use o teclado físico ou o teclado na tela.</p>
  `);
}

function showStats() {
  const stats = getStats();
  const percentage = stats.played
    ? Math.round(stats.wins / stats.played * 100)
    : 0;

  const bars = stats.distribution.map((count, index) => {
    const width = Math.max(
      count ? 8 : 0,
      stats.wins ? count / Math.max(...stats.distribution, 1) * 100 : 0
    );

    return `
      <div style="display:flex;gap:8px;align-items:center;margin:5px 0">
        <span>${index + 1}</span>
        <div style="background:#398b64;width:${width}%;min-width:${count ? 25 : 0}px;padding:2px 7px;text-align:right">
          ${count}
        </div>
      </div>
    `;
  }).join("");

  showModal("Estatísticas", `
    <div style="display:flex;justify-content:space-around;text-align:center">
      <div><h2>${stats.played}</h2>Jogos</div>
      <div><h2>${percentage}%</h2>Vitórias</div>
      <div><h2>${stats.streak}</h2>Sequência</div>
    </div>
    <h3>Distribuição das tentativas</h3>
    ${bars}
    <p>Maior sequência: ${stats.maxStreak}</p>
  `);
}

function showSettings() {
  showModal("Configurações", `
    <p>Deseja começar uma nova partida?</p>
    <button id="modal-new-game" style="padding:12px;border:0;border-radius:8px;background:#398b64;color:white;cursor:pointer">
      Novo jogo
    </button>
    <p>Suas estatísticas são salvas neste navegador.</p>
  `);

  document.querySelector("#modal-new-game").addEventListener("click", () => {
    modal.close();
    newGame();
  });
}

keyboard.addEventListener("click", event => {
  const key = event.target.closest("[data-key]");
  if (!key) return;

  const value = key.dataset.key;

  if (value === "ENTER") {
    submitGuess();
  } else if (value === "BACKSPACE") {
    deleteLetter();
  } else {
    typeLetter(value);
  }
});

document.addEventListener("keydown", event => {
  if (modal.open) {
    if (event.key === "Escape") modal.close();
    return;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === "Enter") {
    submitGuess();
  } else if (event.key === "Backspace") {
    deleteLetter();
  } else if (/^[a-zA-Z]$/.test(event.key)) {
    typeLetter(event.key.toUpperCase());
  }
});

document.querySelector("#new-game").addEventListener("click", () => {
  if (finished || confirm("Começar uma nova partida?")) {
    newGame();
  }
});

document.querySelector("#help").addEventListener("click", showHelp);
document.querySelector("#stats").addEventListener("click", showStats);
document.querySelector("#settings").addEventListener("click", showSettings);

document.querySelector("#close-modal").addEventListener("click", () => {
  modal.close();
});

modal.addEventListener("click", event => {
  if (event.target === modal) modal.close();
});

newGame();