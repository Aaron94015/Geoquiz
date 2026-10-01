import type { Region } from "../data/geography";
import { score, type Quiz } from "../features/quiz/quiz";
export function ResultsScreen({
  region,
  quiz,
  onAgain,
  onRegion,
  onContinent,
}: {
  region: Region;
  quiz: Quiz;
  onAgain: () => void;
  onRegion: () => void;
  onContinent: () => void;
}) {
  const points = score(quiz);
  return (
    <main className="screen results">
      <div className="result-mark">✓</div>
      <span className="eyebrow">Quiz complete</span>
      <h1>
        {points === quiz.questions.length
          ? "Perfect map!"
          : points >= quiz.questions.length * 0.7
            ? "Great work!"
            : "Keep exploring!"}
      </h1>
      <p>{region.name}</p>
      <div className="score">
        <strong>{points}</strong>
        <span>/ {quiz.questions.length}</span>
      </div>
      <p className="score-label">countries located correctly</p>
      <div className="result-actions">
        <button className="primary" onClick={onAgain}>
          Play again <span>↻</span>
        </button>
        <button className="secondary" onClick={onRegion}>
          Choose another region
        </button>
        <button className="text-button" onClick={onContinent}>
          Choose another continent
        </button>
      </div>
    </main>
  );
}
