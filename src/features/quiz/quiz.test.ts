import { describe, expect, it } from "vitest";
import { answerQuiz, createQuiz, nextQuestion, score } from "./quiz";
import type { Region } from "../../data/geography";
const region: Region = {
  id: "test",
  continentId: "africa",
  name: "Test",
  countries: Array.from({ length: 12 }, (_, i) => ({
    code: `C${i}`,
    name: `Country ${i}`,
  })),
};
describe("quiz rules", () => {
  it("selects at most ten unique countries", () => {
    const quiz = createQuiz(region, () => 0.42);
    expect(quiz.questions).toHaveLength(10);
    expect(new Set(quiz.questions.map((c) => c.code)).size).toBe(10);
  });
  it("uses every country in a short region", () => {
    expect(
      createQuiz({ ...region, countries: region.countries.slice(0, 4) })
        .questions,
    ).toHaveLength(4);
  });
  it("locks after one answer and scores correctly", () => {
    const quiz = createQuiz(region, () => 0.2);
    const answered = answerQuiz(quiz, quiz.questions[0]);
    expect(answerQuiz(answered, region.countries[11])).toBe(answered);
    expect(score(answered)).toBe(1);
  });
  it("signals completion after the final question", () => {
    const quiz = {
      ...createQuiz({ ...region, countries: region.countries.slice(0, 1) }),
      selected: region.countries[0],
    };
    expect(nextQuestion(quiz)).toBeNull();
  });
});
