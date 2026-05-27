/**
 * Returns overlapping active slots for the same teacher on the same day.
 */
function findTeacherConflicts(slots, { teacherId, dayOfWeek, startMinutes, endMinutes, excludeId }) {
  return slots.filter((s) => {
    if (s.id === excludeId) return false;
    if (s.teacherId !== teacherId || s.dayOfWeek !== dayOfWeek || !s.isActive) {
      return false;
    }
    return startMinutes < s.endMinutes && endMinutes > s.startMinutes;
  });
}

/**
 * Returns overlapping active slots for the same class on the same day.
 */
function findClassConflicts(slots, { classLevelId, dayOfWeek, startMinutes, endMinutes, excludeId }) {
  return slots.filter((s) => {
    if (s.id === excludeId) return false;
    if (s.classLevelId !== classLevelId || s.dayOfWeek !== dayOfWeek || !s.isActive) {
      return false;
    }
    return startMinutes < s.endMinutes && endMinutes > s.startMinutes;
  });
}

module.exports = { findTeacherConflicts, findClassConflicts };
