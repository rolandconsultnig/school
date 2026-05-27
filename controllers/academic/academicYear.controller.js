const responseStatus = require("../../handlers/responseStatus.handler");
const { auditAcademic } = require("../../lib/audit/academicAudit");
const {
  createAcademicYearService,
  getAcademicYearsService,
  getAcademicYearService,
  updateAcademicYearService,
  deleteAcademicYearService,
} = require("../../services/academic/academicYear.service");

/**
 * @desc Create Academic Year
 * @route POST /api/v1/academic-years
 * @access Private
 **/
exports.createAcademicYearController = async (req, res) => {
  try {
    await createAcademicYearService(req.body, req.userAuth.id, res);
    await auditAcademic(req, "CREATE", "AcademicYear", null, req.body);
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

/**
 * @desc Get all Academic Years
 * @route GET /api/v1/academic-years
 * @access Private
 **/
exports.getAcademicYearsController = async (req, res) => {
  try {
    const result = await getAcademicYearsService();
    responseStatus(res, 201, "success", result);
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

/**
 * @desc Get single Academic Year
 * @route GET /api/v1/academic-years/:id
 * @access Private
 **/
exports.getAcademicYearController = async (req, res) => {
  try {
    const result = await getAcademicYearService(req.params.id);
    responseStatus(res, 201, "success", result);
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

/**
 * @desc Update Academic Year
 * @route Patch /api/v1/academic-years/:id
 * @access Private
 **/
exports.updateAcademicYearController = async (req, res) => {
  try {
    await updateAcademicYearService(req.body, req.params.id, req.userAuth.id, res);
    await auditAcademic(req, "UPDATE", "AcademicYear", req.params.id, req.body);
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};

/**
 * @desc Delete Academic Year
 * @route Delete /api/v1/academic-years/:id
 * @access Private
 **/
exports.deleteAcademicYearController = async (req, res) => {
  try {
    const result = await deleteAcademicYearService(req.params.id);
    await auditAcademic(req, "DELETE", "AcademicYear", req.params.id);
    responseStatus(res, 201, "success", result);
  } catch (error) {
    responseStatus(res, 400, "failed", error.message);
  }
};
