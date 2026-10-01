import type { Country, Region } from "../../data/geography";
export type Answer = { target: Country; selected: Country; correct: boolean };
export type Quiz = {
  questions: Country[];
  index: number;
  answers: Answer[];
  selected: Country | null;
};
export function shuffled<T>(items: readonly T[], random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function createQuiz(region: Region, random = Math.random): Quiz {
  return {
    questions: shuffled(region.countries, random).slice(
      0,
      Math.min(10, region.countries.length),
    ),
    index: 0,
    answers: [],
    selected: null,
  };
}
export function answerQuiz(quiz: Quiz, selected: Country): Quiz {
  if (quiz.selected) return quiz;
  const target = quiz.questions[quiz.index];
  return {
    ...quiz,
    selected,
    answers: [
      ...quiz.answers,
      { target, selected, correct: target.code === selected.code },
    ],
  };
}
export function nextQuestion(quiz: Quiz): Quiz | null {
  if (!quiz.selected) return quiz;
  return quiz.index + 1 >= quiz.questions.length
    ? null
    : { ...quiz, index: quiz.index + 1, selected: null };
}
export const score = (quiz: Quiz) =>
  quiz.answers.filter((a) => a.correct).length;
