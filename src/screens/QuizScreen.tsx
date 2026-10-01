import { GeoMap } from "../components/GeoMap";
import type { Region, Country } from "../data/geography";
import type { Quiz } from "../features/quiz/quiz";
export function QuizScreen({
  region,
  quiz,
  onAnswer,
  onNext,
  onExit,
}: {
  region: Region;
  quiz: Quiz;
  onAnswer: (c: Country) => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const target = quiz.questions[quiz.index];
  const answered = quiz.selected !== null;
  const correct = quiz.selected?.code === target.code;
  return (
    <main className="quiz-screen">
      <header className="quiz-top">
        <button className="icon-button" aria-label="Exit quiz" onClick={onExit}>
          ×
        </button>
        <div>
          <span>{region.name}</span>
          <strong>
            Question {quiz.index + 1} of {quiz.questions.length}
          </strong>
        </div>
        <div className="progress" aria-hidden="true">
          <i
            style={{
              width: `${((quiz.index + (answered ? 1 : 0)) / quiz.questions.length) * 100}%`,
            }}
          />
        </div>
      </header>
      <section className="prompt" aria-live="polite">
        <span>Find this country</span>
        <h1>{target.name}</h1>
      </section>
      <div className="map-stage">
        <GeoMap
          regions={[region]}
          interactiveCountries
          selectedCode={quiz.selected?.code}
          targetCode={target.code}
          answered={answered}
          onCountry={onAnswer}
          label={`Map of ${region.name}. Find ${target.name}.`}
        />
      </div>
      <footer
        className={`answer-panel ${answered ? (correct ? "is-correct" : "is-incorrect") : ""}`}
        aria-live="polite"
      >
        {answered ? (
          <>
            <div className="feedback">
              <span className="feedback-icon">{correct ? "✓" : "!"}</span>
              <p>
                <strong>{correct ? "Correct!" : "Not quite"}</strong>
                <small>
                  {correct
                    ? `That’s ${target.name}.`
                    : `You chose ${quiz.selected?.name}. ${target.name} is highlighted.`}
                </small>
              </p>
            </div>
            <button className="primary" onClick={onNext}>
              {quiz.index + 1 === quiz.questions.length
                ? "See results"
                : "Next"}{" "}
              <span>→</span>
            </button>
          </>
        ) : (
          <p className="hint">Tap a country on the map</p>
        )}
      </footer>
    </main>
  );
}
