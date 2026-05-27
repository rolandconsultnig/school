const prisma = require("../prisma");

/**
 * Returns the next grade in the same tier by sortOrder, or null if final year.
 */
async function getNextGradeLevel(currentGradeLevelId) {
  const current = await prisma.gradeLevel.findUnique({
    where: { id: currentGradeLevelId },
  });
  if (!current) return null;

  return prisma.gradeLevel.findFirst({
    where: {
      tier: current.tier,
      campusId: current.campusId,
      sortOrder: { gt: current.sortOrder },
      isActive: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

module.exports = { getNextGradeLevel };
