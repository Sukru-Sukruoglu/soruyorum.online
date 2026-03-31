import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Create Organization
    const org = await prisma.organizations.upsert({
        where: { slug: 'soruyorum-online' },
        update: {},
        create: {
            name: 'SoruYorum Online HQ',
            slug: 'soruyorum-online',
            plan: 'enterprise',
        },
    })

    // Create Admin User
    const admin = await prisma.users.upsert({
        where: { email: 'admin@soruyorum.online' },
        update: {},
        create: {
            email: 'admin@soruyorum.online',
            name: 'Super Admin',
            role: 'ADMIN',
            organizationId: org.id,
        },
    })

    // Create Demo Event
    const event = await prisma.events.create({
        data: {
            name: 'Q1 Lansman Toplantısı',
            slug: 'q1-lansman',
            status: 'active',
            startTime: new Date(),
            organizationId: org.id,
            createdBy: admin.id,
            activities: {
                create: [
                    {
                        type: 'quiz',
                        name: 'Ürün Bilgisi',
                        orderIndex: 0,
                        status: 'pending',
                        questions: {
                            create: [
                                {
                                    text: 'Hangi ürünümüz %200 büyüme yakaladı?',
                                    type: 'multiple_choice',
                                    orderIndex: 0,
                                    timeLimit: 30,
                                    options: [
                                        { id: '1', text: 'Analytics v2' },
                                        { id: '2', text: 'Chat Widget' },
                                        { id: '3', text: 'Mobil App' },
                                    ],
                                    correctAnswer: { id: '1' }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    })

    console.log({ org, admin, event })
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
