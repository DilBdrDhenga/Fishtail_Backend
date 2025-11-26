import { Router } from "express";
import { sendEmail, testEmail } from "../controllers/emailController.js";

const emailRouter = Router();

emailRouter.route("/send-email").post(sendEmail);
emailRouter.route("/test-email").get(testEmail);

export default emailRouter;
