import crypto from 'crypto';

const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const secret = generateJWTSecret();
console.log('🔐 Your JWT Secret:');
console.log(secret);
console.log('\n💡 Copy this to your .env file as:');
console.log(`JWT_SECRET=${secret}`);