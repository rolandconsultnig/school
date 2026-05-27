function initialsFromName(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function generateStudentId(name) {
  return (
    "STU" +
    Math.floor(100 + Math.random() * 900) +
    Date.now().toString().slice(2, 4) +
    initialsFromName(name)
  );
}

function generateTeacherId(name) {
  return (
    "TEA" +
    Math.floor(100 + Math.random() * 900) +
    Date.now().toString().slice(2, 4) +
    initialsFromName(name)
  );
}

function generateProgramCode(name) {
  return (
    initialsFromName(name) +
    Math.floor(10 + Math.random() * 90) +
    Math.floor(10 + Math.random() * 90)
  );
}

module.exports = {
  generateStudentId,
  generateTeacherId,
  generateProgramCode,
};
