import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- START FIX ---')
    const email = 'sukru.sukruoglu@gmail.com'

    // Use findFirst to be safer with casing if needed, though findUnique should work
    const user = await prisma.users.findFirst({
        where: {
            email: {
                equals: email,
                mode: 'insensitive' // Optional: ignore case
            }
        },
    })

    if (!user) {
        console.log('User NOT found.')
        const users = await prisma.users.findMany()
        console.log('Available users:', users.map(u => u.email).join(', '))
        return
    }

    console.log(`User found: ${user.email} (ID: ${user.id})`)
    console.log(`Current verify status: ${user.email_verified}`)

    try {
        const updated = await prisma.users.update({
            where: { id: user.id },
            data: {
                email_verified: true, // Correct field name and type (Boolean)
                // status: 'active' // Removed non-existent field
            }
        })
        console.log(`SUCCESS: User verified! New status: ${updated.email_verified}`)
    } catch (err) {
        console.error('Update failed:', err)
    }
    console.log('--- END FIX ---')
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
