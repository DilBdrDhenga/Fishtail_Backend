import crypto from "crypto";

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const secret = generateRefreshToken();
console.log("🔐 Your JWT_REFRESH_SECRET:");
console.log(secret);
console.log("\n💡 Copy this to your .env file as:");
console.log(`JWT_REFRESH_SECRET=${secret}`);
