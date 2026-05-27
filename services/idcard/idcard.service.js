const prisma = require("../../lib/prisma");
const responseStatus = require("../../handlers/responseStatus.handler");
const { serializeForApi } = require("../../utils/serialize");

function renderCardHtml(card, student, template) {
  let layout = {};
  try {
    layout = JSON.parse(template.layoutJson || "{}");
  } catch {
    layout = {};
  }
  const primary = layout.primaryColor || "#1e40af";
  const schoolName = layout.schoolName || "SchoolPortal Nigeria";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>ID ${student.name}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:2rem;background:#f1f5f9}
  .card{width:340px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12);background:#fff}
  .head{background:${primary};color:#fff;padding:1rem;text-align:center}
  .body{padding:1.25rem}
  .qr{margin:1rem auto;width:120px;height:120px;border:2px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:.65rem;text-align:center;padding:.5rem;word-break:break-all}
  .meta{font-size:.85rem;color:#475569;margin:.25rem 0}
  @media print{body{background:#fff;margin:0}.card{box-shadow:none}}
</style></head><body>
<div class="card">
  <div class="head"><h2 style="margin:0;font-size:1.1rem">${schoolName}</h2><p style="margin:.25rem 0 0;opacity:.9">Student ID</p></div>
  <div class="body">
    <h3 style="margin:0 0 .5rem">${student.name}</h3>
    <p class="meta">ID: ${student.studentId || student.id}</p>
    <p class="meta">Tier: ${student.tier || "—"}</p>
    <div class="qr">${card.qrPayload}</div>
  </div>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
}

exports.listTemplatesService = async (res) => {
  const rows = await prisma.idCardTemplate.findMany({ orderBy: { name: "asc" } });
  return responseStatus(res, 200, "success", rows.map(serializeForApi));
};

exports.createTemplateService = async (data, res) => {
  const row = await prisma.idCardTemplate.create({
    data: {
      name: data.name,
      layoutJson: typeof data.layoutJson === "string" ? data.layoutJson : JSON.stringify(data.layoutJson || {}),
      campusId: data.campusId,
      isDefault: !!data.isDefault,
    },
  });
  return responseStatus(res, 201, "success", serializeForApi(row));
};

async function issueOne(studentId, templateId) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  let template;
  if (templateId) {
    template = await prisma.idCardTemplate.findUnique({ where: { id: templateId } });
  } else {
    template = await prisma.idCardTemplate.findFirst({ where: { isDefault: true } });
  }
  if (!template) return null;

  const qrPayload = `SCHOOLPORTAL:${student.studentId || student.id}`;
  return prisma.studentIdCard.create({
    data: { studentId, templateId: template.id, qrPayload, printStatus: "QUEUED" },
    include: { template: true, student: true },
  });
}

exports.issueStudentCardService = async (studentId, templateId, res) => {
  const card = await issueOne(studentId, templateId);
  if (!card) {
    return responseStatus(res, 404, "failed", "Student or template not found");
  }
  return responseStatus(res, 201, "success", {
    ...serializeForApi(card),
    studentName: card.student.name,
    templateName: card.template.name,
  });
};

exports.bulkIssueService = async (studentIds, templateId, res) => {
  const ids = Array.isArray(studentIds) ? studentIds : [];
  const issued = [];
  for (const sid of ids) {
    const card = await issueOne(sid, templateId);
    if (card) issued.push(serializeForApi(card));
  }
  return responseStatus(res, 201, "success", { issued: issued.length, cards: issued });
};

exports.listPrintQueueService = async (status, res) => {
  const rows = await prisma.studentIdCard.findMany({
    where: status ? { printStatus: status } : { printStatus: "QUEUED" },
    include: { student: true, template: true },
    orderBy: { issuedAt: "asc" },
    take: 100,
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((r) => ({
      ...serializeForApi(r),
      studentName: r.student.name,
      templateName: r.template.name,
    }))
  );
};

exports.markPrintedService = async (cardId, res) => {
  const row = await prisma.studentIdCard.update({
    where: { id: cardId },
    data: { printStatus: "PRINTED", printedAt: new Date() },
  });
  return responseStatus(res, 200, "success", serializeForApi(row));
};

exports.previewCardService = async (cardId, res) => {
  const card = await prisma.studentIdCard.findUnique({
    where: { id: cardId },
    include: { student: true, template: true },
  });
  if (!card) return responseStatus(res, 404, "failed", "Card not found");
  res.type("html").send(renderCardHtml(card, card.student, card.template));
};

exports.listStudentCardsService = async (studentId, res) => {
  const rows = await prisma.studentIdCard.findMany({
    where: { studentId },
    include: { template: true },
    orderBy: { issuedAt: "desc" },
  });
  return responseStatus(
    res,
    200,
    "success",
    rows.map((r) => ({
      ...serializeForApi(r),
      templateName: r.template.name,
    }))
  );
};
