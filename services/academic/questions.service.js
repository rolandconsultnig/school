const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

exports.createQuestionsService = async (data, examId, teacherId, res) => {
  const { question, optionA, optionB, optionC, optionD, correctAnswer } = data;

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return responseStatus(res, 404, "failed", "Exam not found");

  const duplicate = await prisma.question.findFirst({ where: { question } });
  if (duplicate)
    return responseStatus(res, 405, "failed", "This question already exists");

  const createQuestions = await prisma.question.create({
    data: {
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      createdById: teacherId,
      exams: { create: { examId } },
    },
  });

  return responseStatus(res, 201, "success", serializeForApi(createQuestions));
};

exports.getAllQuestionsService = async () => {
  const questions = await prisma.question.findMany();
  return questions.map((q) => serializeForApi(q));
};

exports.getQuestionsByIdService = async (questionId) => {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });
  return serializeForApi(question);
};

exports.updateQuestionsService = async (data, questionId, userId, res) => {
  const { question, optionA, optionB, optionC, optionD, correctAnswer } = data;

  const questionFound = await prisma.question.findFirst({
    where: { question, NOT: { id: questionId } },
  });
  if (questionFound)
    return responseStatus(res, 401, "failed", "Question already exists");

  const questionUpdated = await prisma.question.update({
    where: { id: questionId },
    data: {
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      createdById: userId,
    },
  });

  return responseStatus(res, 201, "success", serializeForApi(questionUpdated));
};
