const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().email("email must be valid"),
  password: z.string().min(1, "password is required"),
});

module.exports = { loginSchema };
