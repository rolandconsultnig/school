const {
  hashPassword,
  isPassMatched,
} = require("../../handlers/passHash.handler");
const prisma = require("../../lib/prisma");
const generateToken = require("../../utils/tokenGenerator");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");
const { generateTeacherId } = require("../../utils/entityIds");

exports.createTeacherService = async (data, adminId, res) => {
  const { name, email, password } = data;

  const existTeacher = await prisma.teacher.findUnique({ where: { email } });
  if (existTeacher)
    return responseStatus(res, 402, "failed", "Teacher already exists");

  const hashedPassword = await hashPassword(password);
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) return responseStatus(res, 401, "fail", "Unauthorized access");

  const createTeacher = await prisma.teacher.create({
    data: {
      name,
      email,
      password: hashedPassword,
      teacherId: generateTeacherId(name),
      createdById: admin.id,
      admins: { create: { adminId: admin.id } },
    },
  });

  return responseStatus(res, 200, "success", serializeForApi(createTeacher));
};

exports.teacherLoginService = async (data, res) => {
  const { email, password } = data;
  const teacherFound = await prisma.teacher.findUnique({ where: { email } });

  if (!teacherFound)
    return responseStatus(res, 402, "failed", "Invalid login credentials");

  if (teacherFound.isWithdrawn) {
    return responseStatus(res, 403, "failed", "Account withdrawn. Contact administration.");
  }

  const isMatched = await isPassMatched(password, teacherFound.password);
  if (!isMatched)
    return responseStatus(res, 401, "failed", "Invalid login credentials");

  if (teacherFound.isSuspended) {
    return responseStatus(res, 403, "failed", "Account suspended. Limited access only.");
  }

  const response = {
    teacher: serializeForApi(teacherFound),
    token: generateToken(teacherFound.id),
  };
  return responseStatus(res, 200, "success", response);
};

exports.getAllTeachersService = async () => {
  const teachers = await prisma.teacher.findMany();
  return teachers.map((t) => serializeForApi(t));
};

exports.getTeacherProfileService = async (teacherId) => {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  return serializeForApi(teacher);
};

exports.updateTeacherProfileService = async (data, teacherId, res) => {
  const { name, email, password } = data;

  if (email) {
    const emailExist = await prisma.teacher.findFirst({
      where: { email, NOT: { id: teacherId } },
    });
    if (emailExist)
      return responseStatus(res, 402, "failed", "Email already in use");
  }

  const updateData = {
    ...(name && { name }),
    ...(email && { email }),
    ...(password && { password: await hashPassword(password) }),
  };

  const updatedTeacher = await prisma.teacher.update({
    where: { id: teacherId },
    data: updateData,
  });

  return {
    teacher: serializeForApi(updatedTeacher),
    token: generateToken(updatedTeacher.id),
  };
};

async function updateTeacherStatus(teacherId, data, res) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    return responseStatus(res, 404, "failed", "Teacher not found");
  }

  const updated = await prisma.teacher.update({
    where: { id: teacherId },
    data,
  });
  return responseStatus(res, 200, "success", serializeForApi(updated));
}

exports.suspendTeacherService = (teacherId, res) =>
  updateTeacherStatus(teacherId, { isSuspended: true }, res);

exports.unsuspendTeacherService = (teacherId, res) =>
  updateTeacherStatus(teacherId, { isSuspended: false }, res);

exports.withdrawTeacherService = (teacherId, res) =>
  updateTeacherStatus(teacherId, { isWithdrawn: true, isSuspended: false }, res);

exports.unwithdrawTeacherService = (teacherId, res) =>
  updateTeacherStatus(teacherId, { isWithdrawn: false }, res);

exports.adminUpdateTeacherProfileService = async (data, teacherId) => {
  const { program, classLevel, academicYear, subject } = data;

  const teacherExist = await prisma.teacher.findUnique({
    where: { id: teacherId },
  });
  if (!teacherExist) return "No such teacher found";
  if (teacherExist.isWithdrawn) return "Action denied, teacher is withdrawn";

  const updated = await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      ...(program && { program }),
      ...(classLevel && { classLevel }),
      ...(academicYear && { academicYear }),
    },
  });

  if (subject) {
    await prisma.subject.update({
      where: { id: subject },
      data: { teacherId },
    });
  }

  return serializeForApi(updated);
};
