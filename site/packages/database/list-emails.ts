import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- EMAILS ---')
    const users = await prisma.users.findMany()
    users.forEach(u => console.log(`EMAIL: ${u.email}`))
    console.log('--- END EMAILS ---')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
