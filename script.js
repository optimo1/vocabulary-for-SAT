// Game State
const state = {
  words: [],
  currentPhase: 1,
  currentIndex: 0,
  score: 0,
  totalQuestions: 0,
  wrongWords: [],
  phase1Data: null,
  phase2Matches: {},
  phase2Selected: null,
  phase2Offset: 0,
  phase2CurrentBatchSize: 0,
  phase2CorrectPairs: [],
  phase3Data: null,
  phase4Data: null,
  quizAnswered: false,
};

// Emoji mapping for flashcards
const emojis = ["📖", "🎯", "💡", "📝", "🔍", "📚", "✏️", "🎓", "📊", "🌟"];

// Synonym pairs (simplified - in production would be more comprehensive)

// Sentences for Phase 3

// Initialize
async function init() {
  console.log("Initializing game...");
  try {
    await loadWords();
    console.log("Words loaded successfully, setting up event listeners");
    document.getElementById("loadingState").classList.add("hidden");
    document.getElementById("wordSelectionContent").classList.remove("hidden");
    renderWordSelection();
    setupEventListeners();
  } catch (error) {
    console.error("Initialization failed:", error);
    document.getElementById("loadingState").classList.add("hidden");
    const errorEl = document.getElementById("errorMessage");
    errorEl.classList.remove("hidden");
    errorEl.innerHTML = `
      <p>❌ Failed to load vocabulary data.</p>
      <p style="font-size: 0.9rem; margin-top: 8px;">Error: ${error.message}</p>
      <p style="font-size: 0.85rem; margin-top: 8px; color: #64748b;">
        Make sure vocab.json is in the same folder as this HTML file.<br>
        Open browser console (F12) for more details.
      </p>
      <button class="btn btn-secondary" onclick="location.reload()" style="margin-top: 12px;">Retry</button>
    `;
  }
}

// Load words from JSON
async function loadWords() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    console.log("Attempting to fetch vocab.json...");
    const response = await fetch("vocab.json", {
      signal: controller.signal,
      cache: "force-cache",
    });
    clearTimeout(timeoutId);

    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Loaded words:", data.length, "words");
    state.words = data;
    shuffleArray(state.words);
    console.log("Words shuffled, ready to start");
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Failed to load words:", error);
    throw error;
  }
}

// Fisher-Yates shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Update progress
function updateProgress() {
  const progress = Math.min(((state.currentPhase - 1) / 4) * 100, 100);
  document.getElementById("progressFill").style.width = progress + "%";
  document.getElementById("progressText").textContent =
    state.currentPhase <= 4
      ? `Phase ${state.currentPhase} of 4 • ${state.words.length} words`
      : `Report • ${state.words.length} words`;

  document.querySelectorAll(".phase-dot").forEach((dot, index) => {
    dot.classList.remove("active", "completed");
    if (index + 1 === state.currentPhase) {
      dot.classList.add("active");
    } else if (index + 1 < state.currentPhase) {
      dot.classList.add("completed");
    }
  });
}

// Word Selection
function renderWordSelection() {
  const grid = document.getElementById("wordsGrid");
  grid.innerHTML = "";

  state.words.forEach((wordObj, index) => {
    const item = document.createElement("div");
    item.className = "word-checkbox-item selected";
    item.dataset.index = index;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `word-${index}`;
    checkbox.checked = true;
    checkbox.addEventListener("change", () => {
      item.classList.toggle("selected", checkbox.checked);
    });

    const label = document.createElement("label");
    label.className = "word-checkbox-label";
    label.htmlFor = `word-${index}`;
    label.textContent = wordObj.word;

    // Make the whole item clickable
    item.addEventListener("click", (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        item.classList.toggle("selected", checkbox.checked);
      }
    });

    item.appendChild(checkbox);
    item.appendChild(label);
    grid.appendChild(item);
  });
}

function getSelectedWords() {
  const selectedIndices = [];
  document.querySelectorAll(".word-checkbox-item").forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (checkbox.checked) {
      selectedIndices.push(parseInt(item.dataset.index));
    }
  });
  return selectedIndices.map((index) => state.words[index]);
}

function startGameWithSelectedWords() {
  const selectedWords = getSelectedWords();
  if (selectedWords.length === 0) {
    alert("Please select at least one word!");
    return;
  }
  state.words = selectedWords;
  shuffleArray(state.words);
  state.currentIndex = 0;
  state.score = 0;
  state.wrongWords = [];
  document.getElementById("wordSelectionContent").classList.add("hidden");
  document.getElementById("phaseContent").classList.remove("hidden");
  startPhase1();
}

// Show phase content
function showPhase(phaseNumber) {
  document
    .querySelectorAll('[id^="phase"][id$="Content"]:not(#phaseContent)')
    .forEach((el) => {
      el.classList.add("hidden");
    });
  document.getElementById("reportContent").classList.add("hidden");

  if (phaseNumber === 5) {
    document.getElementById("reportContent").classList.remove("hidden");
  } else {
    const phaseEl = document.getElementById(`phase${phaseNumber}Content`);
    if (phaseEl) phaseEl.classList.remove("hidden");
  }
  state.currentPhase = phaseNumber;
  updateProgress();
}

// Allow jumping directly to any phase (after words are loaded)
function goToPhase(phaseNumber) {
  if (!state.words || state.words.length === 0) return;
  switch (phaseNumber) {
    case 1:
      startPhase1();
      break;
    case 2:
      startPhase2();
      break;
    case 3:
      startPhase3();
      break;
    case 4:
      startPhase4();
      break;
    default:
      break;
  }
}

// Phase 1: Discovery Flashcards
function startPhase1() {
  state.currentIndex = 0;
  showPhase(1);
  document.getElementById("phaseTitle").textContent = "Phase 1: Discovery";
  document.getElementById("phaseDescription").textContent =
    "Explore each word. Click the card to reveal its meaning, an example, and a mnemonic.";
  showFlashcard();
}

function showFlashcard() {
  if (state.currentIndex >= state.words.length) {
    startPhase2();
    return;
  }

  const word = state.words[state.currentIndex];
  const emoji = emojis[state.currentIndex % emojis.length];

  document.getElementById("flashcardEmoji").textContent = emoji;
  document.getElementById("flashcardWord").textContent = word.word;
  document.getElementById("flashcardMeaning").textContent = word.meaning;

  // Show one example + mnemonic (both hidden until meaning revealed)
  const examplesEl = document.getElementById("flashcardExamples");
  const example = word.examples && word.examples.length ? word.examples[0] : "";
  const mnemonic = word.mnemonic || "";
  examplesEl.innerHTML = `
    ${example ? `<div class="example">"${example}"</div>` : ""}
    ${mnemonic ? `<div class="mnemonic">${mnemonic}</div>` : ""}
  `;

  document.getElementById("flashcardMeaning").classList.remove("revealed");
  document.getElementById("revealBtn").textContent = "Reveal Meaning";

  const prevBtn = document.getElementById("prevCardBtn");
  if (prevBtn) {
    prevBtn.disabled = state.currentIndex === 0;
  }
}

function revealMeaning() {
  const meaningEl = document.getElementById("flashcardMeaning");
  const examplesEl = document.getElementById("flashcardExamples");
  const btn = document.getElementById("revealBtn");

  if (meaningEl.classList.contains("revealed")) {
    meaningEl.classList.remove("revealed");
    examplesEl.classList.remove("revealed");
    btn.textContent = "Reveal Meaning";
  } else {
    meaningEl.classList.add("revealed");
    examplesEl.classList.add("revealed");
    btn.textContent = "Hide Meaning";
  }
}

function nextFlashcard() {
  state.currentIndex++;
  showFlashcard();
}

function prevFlashcard() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    showFlashcard();
  }
}

// Phase 2: Match Maker
function startPhase2() {
  state.currentIndex = 0;
  state.phase2Matches = {};
  state.phase2Selected = null;
  state.phase2Offset = 0;
  state.phase2CurrentBatchSize = 0;
  showPhase(2);

  document.getElementById("phaseTitle").textContent = "Phase 2: Match Maker";
  document.getElementById("phaseDescription").textContent =
    "Match each word to one of its synonyms. Click a word, then click its synonym card.";

  renderMatchingGame();
}

function getPhase2Definition(wordObj) {
  const synonyms = wordObj.synonyms;
  if (synonyms && synonyms.length) {
    return synonyms.join(", ");
  }
  return wordObj.meaning || "";
}

function renderMatchingGame() {
  const wordsColumn = document.getElementById("wordsColumn");
  const defsColumn = document.getElementById("definitionsColumn");

  wordsColumn.innerHTML = "";
  defsColumn.innerHTML = "";

  const batchSize = 8;
  const start = state.phase2Offset || 0;
  const end = Math.min(start + batchSize, state.words.length);
  const wordsSubset = state.words.slice(start, end);

  if (!wordsSubset.length) {
    startPhase3();
    return;
  }

  state.phase2Matches = {};
  state.phase2Selected = null;
  state.phase2CurrentBatchSize = wordsSubset.length;

  const defsSubset = wordsSubset
    .map((w) => getPhase2Definition(w))
    .sort(() => Math.random() - 0.5);

  // Render words (left column)
  wordsSubset.forEach((wordObj, index) => {
    const wordEl = document.createElement("div");
    wordEl.className = "matching-item";
    wordEl.textContent = wordObj.word;
    wordEl.dataset.word = wordObj.word;
    wordEl.dataset.index = index;
    wordEl.addEventListener("click", () => selectWord(wordEl));
    wordsColumn.appendChild(wordEl);
  });

  // Render synonyms (right column)
  defsSubset.forEach((def, index) => {
    const defEl = document.createElement("div");
    defEl.className = "matching-item";
    defEl.textContent = def;
    defEl.dataset.definition = def;
    defEl.dataset.index = index;
    defEl.addEventListener("click", () => selectDefinition(defEl));
    defsColumn.appendChild(defEl);
  });
}

function selectWord(element) {
  document.querySelectorAll("#wordsColumn .matching-item").forEach((el) => {
    el.classList.remove("selected");
  });
  element.classList.add("selected");
  state.phase2Selected = element.dataset.word;
}

function selectDefinition(element) {
  if (!state.phase2Selected) {
    showFeedback("matchingFeedback", "Please select a word first.", false);
    return;
  }

  const wordObj = state.words.find((w) => w.word === state.phase2Selected);
  const expectedDef = wordObj ? getPhase2Definition(wordObj) : "";
  const wordEl = document.querySelector(
    `#wordsColumn .matching-item[data-word="${state.phase2Selected}"]`,
  );

  if (expectedDef && element.dataset.definition === expectedDef) {
    state.phase2Matches[state.phase2Selected] = true;
    element.classList.add("matched");
    if (wordEl) {
      wordEl.classList.add("matched");
    }
    showFeedback("matchingFeedback", "Correct!", true);
  } else {
    if (wordEl) {
      wordEl.classList.add("incorrect");
    }
    element.classList.add("incorrect");
    showFeedback("matchingFeedback", "Not quite right. Try again!", false);
  }
}

function showFeedback(elementId, message, isCorrect) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = "feedback show " + (isCorrect ? "correct" : "incorrect");
}

function nextMatchingBatch() {
  state.phase2Offset += state.phase2CurrentBatchSize;
  renderMatchingGame();
}

// Phase 3: Sentence Completion
function startPhase3() {
  state.currentIndex = 0;
  showPhase(3);

  document.getElementById("phaseTitle").textContent =
    "Phase 3: Sentence Completion";
  document.getElementById("phaseDescription").textContent =
    "Fill in the blank with the correct vocabulary word.";

  showSentence();
}

function showSentence() {
  if (state.currentIndex >= state.words.length) {
    startPhase4();
    return;
  }

  const wordObj = state.words[state.currentIndex];
  state.phase3Data = wordObj;

  const examples = wordObj.examples || [];
  const exampleIndex = state.currentIndex % examples.length;
  const example = examples[exampleIndex] || "";
  const sentence = example.replace(new RegExp(wordObj.word, "gi"), "_____");

  document.getElementById("sentenceText").textContent = sentence;

  const input = document.getElementById("blankInput");
  input.value = "";
  input.className = "blank-input";
  input.disabled = false;
  document.getElementById("checkSentenceBtn").disabled = false;

  const prevBtn = document.getElementById("prevSentenceBtn");
  if (prevBtn) {
    prevBtn.disabled = state.currentIndex === 0;
  }

  document.getElementById("sentenceFeedback").classList.remove("show");
}

function checkSentence() {
  const input = document.getElementById("blankInput");
  const answer = input.value.trim();
  const correct = state.phase3Data.word.toLowerCase();

  if (answer === correct) {
    input.className = "blank-input correct";
    showFeedback("sentenceFeedback", "Correct!", true);
    state.score++;
    input.disabled = true;
    document.getElementById("checkSentenceBtn").disabled = true;
  } else {
    input.className = "blank-input incorrect";
    showFeedback(
      "sentenceFeedback",
      `Incorrect. The answer was: ${correct}`,
      false,
    );
    state.wrongWords.push(state.phase3Data);
    setTimeout(() => {
      state.currentIndex++;
      showSentence();
    }, 2000);
  }
  state.totalQuestions++;
}

function handleLetterInput() {
  const input = document.getElementById("blankInput");
  const feedback = document.getElementById("sentenceFeedback");

  if (!state.phase3Data) return;

  const typed = input.value.toLowerCase();
  const correct = state.phase3Data.word.toLowerCase();

  if (!typed) {
    input.className = "blank-input";
    feedback.classList.remove("show");
    feedback.textContent = "";
    return;
  }

  let mismatchIndex = -1;
  const len = Math.min(typed.length, correct.length);
  for (let i = 0; i < len; i++) {
    if (typed[i] !== correct[i]) {
      mismatchIndex = i;
      break;
    }
  }

  if (mismatchIndex === -1) {
    // All typed letters match so far
    feedback.textContent =
      typed.length === 1
        ? "First letter is correct."
        : `Letters 1–${typed.length} are correct so far.`;
    feedback.className = "feedback show correct";

    if (typed.length === correct.length) {
      input.className = "blank-input correct";
    } else {
      input.className = "blank-input";
    }
  } else {
    feedback.textContent = `Letter ${
      mismatchIndex + 1
    } is incorrect. Keep trying.`;
    feedback.className = "feedback show incorrect";
    input.className = "blank-input incorrect";
  }
}

function nextSentence() {
  state.currentIndex++;
  showSentence();
}

function prevSentence() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    showSentence();
  }
}

// Phase 4: Synonym Sprint
function startPhase4() {
  state.currentIndex = 0;
  showPhase(4);

  document.getElementById("phaseTitle").textContent = "Phase 4: Synonym Sprint";
  document.getElementById("phaseDescription").textContent =
    "Choose the word that is most similar in meaning.";
  showQuiz();
}

function showQuiz() {
  if (state.currentIndex >= state.words.length) {
    showReport();
    return;
  }

  state.quizAnswered = false;
  const wordObj = state.words[state.currentIndex];
  state.phase4Data = wordObj;

  document.getElementById("quizQuestion").textContent =
    `Which word is most similar to "${wordObj.word}"?`;

  const correctSynonym = wordObj.synonyms[0];
  const otherSynonyms = wordObj.synonyms.slice(1);
  const wrongOptions =
    otherSynonyms.length >= 3
      ? otherSynonyms.slice(0, 3)
      : generateWrongOptions(wordObj.word, 3 - otherSynonyms.length);

  const options = [correctSynonym, ...wrongOptions];
  shuffleArray(options);

  const optionsContainer = document.getElementById("quizOptions");
  optionsContainer.innerHTML = "";

  options.forEach((option) => {
    const optionEl = document.createElement("div");
    optionEl.className = "quiz-option";
    optionEl.textContent = option;
    optionEl.addEventListener("click", () =>
      selectQuizOption(optionEl, option, correctSynonym),
    );
    optionsContainer.appendChild(optionEl);
  });

  document.getElementById("quizFeedback").classList.remove("show");
  document.getElementById("nextQuizBtn").disabled = true;
}

function generateWrongOptions(correctWord, count) {
  const allWords = state.words
    .filter((w) => w.word !== correctWord)
    .flatMap((w) => w.synonyms);
  const shuffled = allWords.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function selectQuizOption(element, selected, correct) {
  if (state.quizAnswered) return;
  state.quizAnswered = true;

  document.querySelectorAll(".quiz-option").forEach((opt) => {
    opt.style.pointerEvents = "none";
  });

  const isCorrect = selected === correct;
  element.classList.add(isCorrect ? "correct" : "incorrect");

  if (!isCorrect) {
    document.querySelectorAll(".quiz-option").forEach((opt) => {
      if (opt.textContent === correct) {
        opt.classList.add("correct");
      }
    });
    state.wrongWords.push(state.phase4Data);
  } else {
    state.score++;
  }
  state.totalQuestions++;

  const feedback = document.getElementById("quizFeedback");
  feedback.textContent = isCorrect
    ? "Correct!"
    : `Incorrect. The answer was: ${correct}`;
  feedback.className = "feedback show " + (isCorrect ? "correct" : "incorrect");
  document.getElementById("nextQuizBtn").disabled = false;
}

function nextQuiz() {
  state.currentIndex++;
  showQuiz();
}

// Final Report
function showReport() {
  showPhase(5);
  document.getElementById("phaseTitle").textContent = "";
  document.getElementById("phaseDescription").textContent = "";

  const percentage = Math.round((state.score / state.totalQuestions) * 100);
  document.getElementById("scoreValue").textContent = percentage + "%";
  document
    .getElementById("scoreCircle")
    .style.setProperty("--score", percentage / 100);

  let summary = "";
  if (percentage >= 90) {
    summary = "Outstanding! You have mastered these vocabulary words.";
  } else if (percentage >= 70) {
    summary =
      "Great job! You have a good grasp of these words, but some need more practice.";
  } else if (percentage >= 50) {
    summary = "Good effort! Keep practicing to improve your vocabulary.";
  } else {
    summary = "Keep learning! Review the words below and try again.";
  }
  document.getElementById("summaryText").textContent = summary;

  const reviewSection = document.getElementById("reviewSection");
  const wordsToReview = document.getElementById("wordsToReview");

  if (state.wrongWords.length === 0) {
    reviewSection.style.display = "none";
  } else {
    reviewSection.style.display = "block";
    wordsToReview.innerHTML = "";
    const uniqueWords = [...new Set(state.wrongWords.map((w) => w.word))];
    uniqueWords.forEach((word) => {
      const wordObj = state.words.find((w) => w.word === word);
      const div = document.createElement("div");
      div.className = "word-to-review";
      div.innerHTML = `<strong>${word}</strong>: ${wordObj.meaning}`;
      wordsToReview.appendChild(div);
    });
  }
}

// Event Listeners
function setupEventListeners() {
  // Word selection buttons
  document.getElementById("selectAllBtn").addEventListener("click", () => {
    document
      .querySelectorAll(".word-checkbox-item input[type='checkbox']")
      .forEach((cb) => {
        cb.checked = true;
        cb.closest(".word-checkbox-item").classList.add("selected");
      });
  });

  document.getElementById("clearAllBtn").addEventListener("click", () => {
    document
      .querySelectorAll(".word-checkbox-item input[type='checkbox']")
      .forEach((cb) => {
        cb.checked = false;
        cb.closest(".word-checkbox-item").classList.remove("selected");
      });
  });

  document
    .getElementById("startGameBtn")
    .addEventListener("click", startGameWithSelectedWords);

  // Game phase buttons
  document.getElementById("flashcard").addEventListener("click", revealMeaning);
  document.getElementById("revealBtn").addEventListener("click", revealMeaning);
  document
    .getElementById("prevCardBtn")
    .addEventListener("click", prevFlashcard);
  document
    .getElementById("nextCardBtn")
    .addEventListener("click", nextFlashcard);
  document.getElementById("checkMatchBtn").addEventListener("click", () => {
    if (
      Object.keys(state.phase2Matches).length === state.phase2CurrentBatchSize
    ) {
      showFeedback(
        "matchingFeedback",
        "All matches in this round are correct!",
        true,
      );
    } else {
      showFeedback(
        "matchingFeedback",
        "Match all words in this round to continue!",
        false,
      );
    }
  });
  document
    .getElementById("checkSentenceBtn")
    .addEventListener("click", checkSentence);
  document
    .getElementById("nextSentenceBtn")
    .addEventListener("click", nextSentence);
  document
    .getElementById("prevSentenceBtn")
    .addEventListener("click", prevSentence);
  document.getElementById("blankInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkSentence();
  });
  document
    .getElementById("blankInput")
    .addEventListener("input", handleLetterInput);
  document.getElementById("nextQuizBtn").addEventListener("click", nextQuiz);

  // Phase navigation: allow jumping directly to any phase
  document.querySelectorAll(".phase-dot").forEach((dot) => {
    const phase = parseInt(dot.getAttribute("data-phase"), 10);
    if (!Number.isNaN(phase)) {
      dot.style.cursor = "pointer";
      dot.addEventListener("click", () => goToPhase(phase));
    }
  });
}

// Start the game
init();
