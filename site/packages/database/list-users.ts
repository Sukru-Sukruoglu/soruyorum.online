import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- START LIST ---')
    const users = await prisma.users.findMany()
    console.log(JSON.stringify(users, null, 2))
    console.log('--- END LIST ---')
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
