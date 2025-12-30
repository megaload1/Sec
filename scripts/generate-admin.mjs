import { hash } from 'bcryptjs';

async function generateAdminHash() {
  try {
    const password = 'flashbot123';
    const hashedPassword = await hash(password, 12);
    console.log('Admin Password Hash:', hashedPassword);
    console.log('Email: admin@flashbot.com');
    console.log('Password: flashbot123');
    console.log('\nUse this hash in your SQL script');
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateAdminHash();
