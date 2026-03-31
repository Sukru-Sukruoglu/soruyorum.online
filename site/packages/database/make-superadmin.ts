import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'sukru@keypadsistem.com'
    console.log(`Promoting user: ${email} to ADMIN...`)

    const user = await prisma.users.findUnique({
        where: { email },
    })

    if (!user) {
        console.log('User not found!')
        return
    }

    const updated = await prisma.users.update({
        where: { id: user.id },
        data: {
            role: 'ADMIN'
        }
    })
    console.log(`SUCCESS: User ${updated.email} role is now: ${updated.role}`)
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
