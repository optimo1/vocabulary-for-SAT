# SAT Vocabulary Game

An interactive web-based vocabulary learning game designed to help students prepare for the SAT exam.

## Why I Built This

I'm preparing for the SAT and needed an effective way to master high-frequency vocabulary words. Instead of just memorizing lists, I wanted an engaging, multi-modal learning experience that reinforces words through different contexts and activities.

This game implements evidence-based learning techniques:
- **Discovery**: Flashcards with meanings and example sentences
- **Match Maker**: Word-to-synonym matching for semantic connections
- **Context Mastery**: Fill-in-the-blank sentences using real usage examples
- **Synonym Sprint**: Multiple-choice synonym recognition under time pressure

## Word Source

The vocabulary is based on the "1000 Words for SAT" list from SparkNotes:
- Source: [SAT Vocabulary PDF](https://img.sparknotes.com/content/testprep/pdf/sat.vocab.pdf)
- The `vocab.json` file contains 143 curated words with:
  - Word definition
  - Synonyms
  - Example sentences

## Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/optimo1/vocabulary-for-SAT.git
   cd vocabulary-for-SAT
   ```

2. **Start a local server**
   ```bash
   python3 -m http.server 8000
   ```
   Or use any other local HTTP server (Node.js `http-server`, VS Code Live Server, etc.)

3. **Open in browser**
   Navigate to `http://localhost:8000`

4. **Play the game!**
   - Click through all 4 phases
   - Track your progress with the built-in progress bar
- Review your final report at the end

## Technical Details

- Single-file HTML/CSS/JavaScript (no build process required)
- Responsive design for mobile and desktop
- Fetches vocabulary data from `vocab.json`
- Uses Fisher-Yates shuffle for randomized gameplay
- No external dependencies

## Future Improvements

- Add more words from the full 1000-word list
- Implement spaced repetition algorithm
- Add user progress persistence (localStorage)
- Include pronunciation audio
- Track time per question

---

Built with Freakyness 👅.
