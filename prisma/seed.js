require("dotenv").config({ override: true });

const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../handlers/passHash.handler");
const { PERMISSIONS, ROLES, ROLE_PERMISSIONS } = require("../lib/rbac/permissions");
const { NIGERIA_GRADE_CATALOG } = require("../lib/nigeria/gradeCatalog");
const { generateStudentId, generateTeacherId } = require("../utils/entityIds");

const prisma = new PrismaClient();

async function seedPermissions() {
  for (const [code, meta] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      create: {
        code,
        module: meta.module,
        resource: meta.resource,
        action: meta.action,
        description: meta.description,
      },
      update: {
        module: meta.module,
        resource: meta.resource,
        action: meta.action,
        description: meta.description,
      },
    });
  }
}

async function seedRoles() {
  const allPermissions = await prisma.permission.findMany();
  const byCode = Object.fromEntries(allPermissions.map((p) => [p.code, p]));

  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { code: roleDef.code },
      create: {
        code: roleDef.code,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
      update: {
        name: roleDef.name,
        description: roleDef.description,
      },
    });

    const permCodes = ROLE_PERMISSIONS[roleDef.code] || [];
    for (const code of permCodes) {
      const perm = byCode[code];
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        create: { roleId: role.id, permissionId: perm.id },
        update: {},
      });
    }
  }
}

async function seedGrades() {
  for (const grade of NIGERIA_GRADE_CATALOG) {
    await prisma.gradeLevel.upsert({
      where: { code: grade.code },
      create: grade,
      update: {
        name: grade.name,
        tier: grade.tier,
        sortOrder: grade.sortOrder,
        nigerianLabel: grade.nigerianLabel,
      },
    });
  }
}

async function seedDemoOrganization() {
  const org = await prisma.organization.upsert({
    where: { slug: "demo-school-ng" },
    create: {
      name: "Demo School Nigeria",
      slug: "demo-school-ng",
      country: "NG",
    },
    update: {},
  });

  const campus = await prisma.campus.upsert({
    where: {
      organizationId_code: { organizationId: org.id, code: "MAIN" },
    },
    create: {
      organizationId: org.id,
      name: "Main Campus",
      code: "MAIN",
      city: "Lagos",
      state: "Lagos",
      tiers: {
        create: [
          { tier: "NURSERY" },
          { tier: "PRIMARY" },
          { tier: "SECONDARY" },
        ],
      },
    },
    update: {},
    include: { tiers: true },
  });

  return { org, campus };
}

async function seedSuperAdmin(orgId) {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@school.local";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD || "SuperAdmin@123";

  let admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        name: "Super Admin",
        email,
        password: await hashPassword(password),
        role: "admin",
      },
    });
  }

  const superRole = await prisma.role.findUnique({ where: { code: "SUPER_ADMIN" } });

  await prisma.userAccount.upsert({
    where: { email },
    create: {
      email,
      password: admin.password,
      profileType: "ADMIN",
      profileId: admin.id,
      organizationId: orgId,
    },
    update: { organizationId: orgId },
  });

  const account = await prisma.userAccount.findUnique({ where: { email } });

  if (superRole && account) {
    const existing = await prisma.userRoleAssignment.findFirst({
      where: { userAccountId: account.id, roleId: superRole.id },
    });
    if (!existing) {
      await prisma.userRoleAssignment.create({
        data: { userAccountId: account.id, roleId: superRole.id },
      });
    }
  }

  console.log(`Super admin seeded: ${email}`);
}

async function assignUserRole(userAccountId, roleCode, campusId) {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) return;
  const existing = await prisma.userRoleAssignment.findFirst({
    where: { userAccountId, roleId: role.id },
  });
  if (!existing) {
    await prisma.userRoleAssignment.create({
      data: { userAccountId, roleId: role.id, campusId: campusId ?? null },
    });
  }
}

async function seedDemoUsers(orgId, campusId, adminId) {
  const teacherEmail = process.env.SEED_TEACHER_EMAIL || "teacher@school.local";
  const teacherPassword = process.env.SEED_TEACHER_PASSWORD || "Teacher@123";
  const studentEmail = process.env.SEED_STUDENT_EMAIL || "student@school.local";
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || "Student@123";
  const parentEmail = process.env.SEED_PARENT_EMAIL || "parent@school.local";
  const parentPassword = process.env.SEED_PARENT_PASSWORD || "Parent@123";

  const grade = await prisma.gradeLevel.findUnique({
    where: { code: "NG_PRI_3" },
  });

  const teacherHash = await hashPassword(teacherPassword);
  let teacher = await prisma.teacher.findUnique({ where: { email: teacherEmail } });
  if (!teacher) {
    teacher = await prisma.teacher.create({
      data: {
        name: "Demo Teacher",
        email: teacherEmail,
        password: teacherHash,
        teacherId: generateTeacherId("Demo Teacher"),
        applicationStatus: "approved",
        createdById: adminId,
        admins: { create: { adminId } },
      },
    });
  } else {
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        password: teacherHash,
        applicationStatus: "approved",
        isWithdrawn: false,
        isSuspended: false,
      },
    });
  }

  const studentHash = await hashPassword(studentPassword);
  let student = await prisma.student.findUnique({ where: { email: studentEmail } });
  if (!student) {
    student = await prisma.student.create({
      data: {
        name: "Demo Student",
        email: studentEmail,
        password: studentHash,
        studentId: generateStudentId("Demo Student"),
        tier: "PRIMARY",
        campusId,
        gradeLevelId: grade?.id,
        section: "A",
        admins: { create: { adminId } },
      },
    });
  } else {
    await prisma.student.update({
      where: { id: student.id },
      data: {
        password: studentHash,
        campusId,
        tier: "PRIMARY",
        gradeLevelId: grade?.id ?? student.gradeLevelId,
        isWithdrawn: false,
        isSuspended: false,
      },
    });
  }

  const parentHash = await hashPassword(parentPassword);
  let parent = await prisma.parent.findUnique({ where: { email: parentEmail } });
  if (!parent) {
    parent = await prisma.parent.create({
      data: {
        name: "Demo Parent",
        email: parentEmail,
        password: parentHash,
        phone: "+2348000000001",
        campusId,
      },
    });
  } else {
    await prisma.parent.update({
      where: { id: parent.id },
      data: { password: parentHash, campusId },
    });
  }

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId: parent.id, studentId: student.id },
    },
    create: {
      parentId: parent.id,
      studentId: student.id,
      relationship: "Mother",
      isPrimary: true,
    },
    update: { isPrimary: true },
  });

  const teacherRole = await prisma.role.findUnique({ where: { code: "TEACHER" } });
  const studentRole = await prisma.role.findUnique({ where: { code: "STUDENT" } });
  const parentRole = await prisma.role.findUnique({ where: { code: "PARENT" } });

  for (const [email, profileType, profileId, role] of [
    [teacherEmail, "TEACHER", teacher.id, teacherRole],
    [studentEmail, "STUDENT", student.id, studentRole],
    [parentEmail, "PARENT", parent.id, parentRole],
  ]) {
    const hash =
      profileType === "TEACHER"
        ? teacherHash
        : profileType === "STUDENT"
          ? studentHash
          : parentHash;

    const account = await prisma.userAccount.upsert({
      where: { email },
      create: {
        email,
        password: hash,
        profileType,
        profileId,
        organizationId: orgId,
      },
      update: {
        password: hash,
        profileId,
        organizationId: orgId,
        isActive: true,
      },
    });

    if (role) {
      await assignUserRole(account.id, role.code, campusId);
    }
  }

  console.log("Demo users seeded:");
  console.log(`  Teacher (Staff portal): ${teacherEmail} / ${teacherPassword}`);
  console.log(`  Student portal:         ${studentEmail} / ${studentPassword}`);
  console.log(`  Parent portal:          ${parentEmail} / ${parentPassword}`);

  return { student, teacher, parent };
}

async function seedStudentPortalDemo(campusId, adminId, student, teacher) {
  const grade = await prisma.gradeLevel.findUnique({ where: { code: "NG_PRI_3" } });
  let classLevel = await prisma.classLevel.findFirst({
    where: { name: "Primary 3A", campusId },
  });
  if (!classLevel) {
    classLevel = await prisma.classLevel.create({
      data: {
        name: "Primary 3A",
        campusId,
        tier: "PRIMARY",
        createdById: adminId,
        admins: { create: { adminId } },
      },
    });
  }

  await prisma.studentClassLevel.upsert({
    where: {
      studentId_classLevelId: {
        studentId: student.id,
        classLevelId: classLevel.id,
      },
    },
    create: { studentId: student.id, classLevelId: classLevel.id },
    update: {},
  });

  let term = await prisma.academicTerm.findFirst();
  if (!term) {
    term = await prisma.academicTerm.create({
      data: {
        name: "First Term 2025/2026",
        description: "First academic term",
        createdById: adminId,
        admins: { create: { adminId } },
      },
    });
  }

  let subject = await prisma.subject.findFirst({ where: { name: "Mathematics" } });
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        name: "Mathematics",
        description: "Mathematics",
        teacherId: teacher.id,
        academicTermId: term.id,
        createdById: adminId,
      },
    });
  }

  let course = await prisma.course.findFirst({
    where: { title: "Mathematics — Primary 3" },
  });
  if (!course) {
    course = await prisma.course.create({
      data: {
        title: "Mathematics — Primary 3",
        description: "Core numeracy and problem solving",
        subjectId: subject.id,
        classLevelId: classLevel.id,
        teacherId: teacher.id,
        campusId,
        tier: "PRIMARY",
        academicTermId: term.id,
        isPublished: true,
      },
    });
  }

  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentId: { courseId: course.id, studentId: student.id },
    },
    create: { courseId: course.id, studentId: student.id },
    update: {},
  });

  const dueSoon = new Date(Date.now() + 24 * 3600000);
  const existingAssign = await prisma.assignment.findFirst({
    where: { courseId: course.id, title: "Week 4 Homework" },
  });
  if (!existingAssign) {
    await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: "Week 4 Homework",
        description: "Complete exercises 1–10",
        dueAt: dueSoon,
        isPublished: true,
        maxScore: 100,
      },
    });
  }

  const dayOfWeek = new Date().getDay();
  const slotExists = await prisma.timetableSlot.findFirst({
    where: { classLevelId: classLevel.id, dayOfWeek, subjectId: subject.id },
  });
  if (!slotExists) {
    await prisma.timetableSlot.create({
      data: {
        classLevelId: classLevel.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        campusId,
        tier: "PRIMARY",
        dayOfWeek,
        startMinutes: 9 * 60,
        endMinutes: 10 * 60,
        room: "Block B — Room 12",
        academicTermId: term.id,
      },
    });
  }

  for (const ann of [
    {
      title: "Mid-term break",
      body: "School closes Friday 24 Oct. Resume Monday 3 Nov.",
      category: "HOLIDAY",
      isPinned: true,
    },
    {
      title: "Science fair",
      body: "Register your project by next Wednesday in the LMS.",
      category: "EVENT",
      isPinned: false,
    },
  ]) {
    const exists = await prisma.campusAnnouncement.findFirst({
      where: { campusId, title: ann.title },
    });
    if (!exists) {
      await prisma.campusAnnouncement.create({
        data: { campusId, ...ann },
      });
    }
  }

  await prisma.studentCampusWallet.upsert({
    where: { studentId: student.id },
    create: { studentId: student.id, balance: 4500 },
    update: { balance: 4500 },
  });

  const template = await prisma.idCardTemplate.findFirst({ where: { isDefault: true } });
  if (template) {
    const hasCard = await prisma.studentIdCard.findFirst({ where: { studentId: student.id } });
    if (!hasCard) {
      await prisma.studentIdCard.create({
        data: {
          studentId: student.id,
          templateId: template.id,
          qrPayload: `SCHOOLPORTAL:${student.studentId}`,
        },
      });
    }
  }

  const fee = await prisma.feeStructure.findFirst({ where: { name: "Term tuition" } });
  if (!fee) {
    const fs = await prisma.feeStructure.create({
      data: {
        name: "Term tuition",
        amount: 85000,
        campusId,
        tier: "PRIMARY",
      },
    });
    await prisma.studentFee.create({
      data: {
        studentId: student.id,
        feeStructureId: fs.id,
        amountDue: 85000,
        amountPaid: 40000,
        status: "PARTIAL",
      },
    });
  }
}

async function seedIdCardTemplate() {
  const existing = await prisma.idCardTemplate.findFirst({
    where: { isDefault: true },
  });
  if (existing) return;
  await prisma.idCardTemplate.create({
    data: {
      name: "Default student card",
      layoutJson: JSON.stringify({ version: 1, fields: ["name", "photo", "qr"] }),
      isDefault: true,
    },
  });
}

async function main() {
  console.log("Seeding permissions...");
  await seedPermissions();
  console.log("Seeding roles...");
  await seedRoles();
  console.log("Seeding Nigeria grade catalog...");
  await seedGrades();
  console.log("Seeding demo organization...");
  const { org, campus } = await seedDemoOrganization();
  console.log("Seeding super admin...");
  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@school.local";
  await seedSuperAdmin(org.id);
  const admin = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (admin) {
    console.log("Seeding demo teacher, student, and parent...");
    const { student, teacher } = await seedDemoUsers(org.id, campus.id, admin.id);
    if (student && teacher) {
      console.log("Seeding student portal demo data...");
      await seedStudentPortalDemo(campus.id, admin.id, student, teacher);
    }
  }
  console.log("Seeding ID card template...");
  await seedIdCardTemplate();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
