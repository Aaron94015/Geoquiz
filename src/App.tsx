import { useState } from "react";
import { ContinentScreen } from "./screens/ContinentScreen";
import { RegionScreen } from "./screens/RegionScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import {
  continentById,
  regionById,
  type ContinentId,
  type Region,
  type Country,
} from "./data/geography";
import {
  answerQuiz,
  createQuiz,
  nextQuestion,
  type Quiz,
} from "./features/quiz/quiz";
type Screen = "continents" | "regions" | "quiz" | "results";
export default function App() {
  const [screen, setScreen] = useState<Screen>("continents");
  const [continent, setContinent] = useState<ContinentId | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const start = (next: Region) => {
    setRegion(next);
    setQuiz(createQuiz(next));
    setScreen("quiz");
    window.scrollTo(0, 0);
  };
  const chooseContinent = (id: ContinentId) => {
    setContinent(id);
    const c = continentById(id);
    if (c.regionIds.length === 1) start(regionById(c.regionIds[0])!);
    else setScreen("regions");
  };
  const exit = () => {
    if (window.confirm("Leave this quiz? Your progress will be lost."))
      setScreen(continent === "south-america" ? "continents" : "regions");
  };
  const answer = (country: Country) =>
    setQuiz((q: Quiz | null) => (q ? answerQuiz(q, country) : q));
  const next = () => {
    if (!quiz) return;
    const updated = nextQuestion(quiz);
    if (updated) setQuiz(updated);
    else setScreen("results");
  };
  if (screen === "continents" || !continent)
    return <ContinentScreen onChoose={chooseContinent} />;
  if (screen === "regions")
    return (
      <RegionScreen
        continentId={continent}
        onChoose={start}
        onBack={() => setScreen("continents")}
      />
    );
  if (!region || !quiz) return null;
  if (screen === "quiz")
    return (
      <QuizScreen
        region={region}
        quiz={quiz}
        onAnswer={answer}
        onNext={next}
        onExit={exit}
      />
    );
  return (
    <ResultsScreen
      region={region}
      quiz={quiz}
      onAgain={() => start(region)}
      onRegion={() =>
        setScreen(continent === "south-america" ? "continents" : "regions")
      }
      onContinent={() => setScreen("continents")}
    />
  );
}
