import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- START ---')
    const email = 'sukru.sukruoglu@gmail.com'
    console.log(`Searching for user: ${email}...`)

    const user = await prisma.users.findUnique({
        where: { email },
    })

    if (!user) {
        console.log('User NOT found in database.')
        console.log('Listing all users:')
        const users = await prisma.users.findMany()
        users.forEach(u => console.log(`- ${u.email} (${u.status})`))
        return
    }

    console.log(`User found (ID: ${user.id}). Current Verified: ${user.emailVerified}`)

    const updated = await prisma.users.update({
        where: { id: user.id },
        data: {
            emailVerified: new Date(),
            status: 'active'
        }
    })
    console.log('User verified successfully at:', updated.emailVerified)
    console.log('--- END ---')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('ERROR:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
