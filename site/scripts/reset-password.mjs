import { Scrypt } from 'lucia';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const scrypt = new Scrypt();

const email = process.argv[2] || 'admin@soruyorum.online';
const password = process.argv[3] || 'admin123';

async function main() {
    const hash = await scrypt.hash(password);
    console.log('Generated hash:', hash);
    
    const result = await prisma.user.update({
        where: { email },
        data: { passwordHash: hash }
    });
    
    console.log(`Password updated for ${email}`);
    console.log(`New password: ${password}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
