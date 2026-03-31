import { z } from "zod";
import { router, publicProcedure, superAdminProcedure } from "../trpc";

const PricingCardSchema = z.object({
  title: z.string(),
  price: z.string(),
  support: z.string(),
  features: z.array(z.string()),
  mutedFeatures: z.array(z.string()),
  cta: z.string(),
  packageId: z.string().optional(),
  active: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

const PricingSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  cards: z.array(PricingCardSchema),
});

const PricingDataSchema = z.object({
  sections: z.array(PricingSectionSchema),
});

// Migrate old 4-key format to new sections format
function migrateLegacy(data: any): any {
  if (data && Array.isArray(data.sections)) return data;
  if (data && data.pricingCards) {
    const LEGACY_MAP: [string, string, string][] = [
      ["pricingCards", "Event Paketleri", "Tek etkinlik bazlı paketler ile katılımcı sayınıza uygun çözümü seçin."],
      ["additionalPricingCards", "Özel Markalı Paketler", "Soruyorum altyapısını kendi markanızla kullanabilirsiniz."],
      ["multiEventPricingCards", "Çoklu Event Paketleri", "Birden fazla etkinliği tek paketle avantajlı fiyatlarla yönetin."],
      ["yearlyUnlimitedPricingCards", "Yıllık Sınırsız Paket", "Standart ve Özel Markalı yıllık sınırsız paket seçenekleri."],
    ];
    return {
      sections: LEGACY_MAP.map(([key, label, desc]) => ({
        id: key,
        label,
        description: desc,
        cards: data[key] || [],
      })),
    };
  }
  return data;
}

export const settingsRouter = router({
  getPricing: publicProcedure.query(async ({ ctx }) => {
    const row = await ctx.prisma.app_settings.findUnique({
      where: { key: "pricing" },
    });
    if (!row?.value) return null;
    return migrateLegacy(row.value);
  }),

  updatePricing: superAdminProcedure
    .input(PricingDataSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.app_settings.upsert({
        where: { key: "pricing" },
        create: {
          key: "pricing",
          value: input as any,
          updated_by: ctx.user.id as string,
        },
        update: {
          value: input as any,
          updated_by: ctx.user.id as string,
        },
      });
      return { success: true };
    }),
});
