import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'sukru@keypadsistem.com' // Corrected based on DB list
    console.log(`Verifying: ${email}`)

    const user = await prisma.users.findUnique({
        where: { email },
    })

    if (!user) {
        console.log('User not found!'); return
    }

    await prisma.users.update({
        where: { id: user.id },
        data: {
            email_verified: true
        }
    })
    console.log(`SUCCESS: ${email} is now verified.`)
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
