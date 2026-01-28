/**
 * FlashSaleService.ts
 * Gère les ventes flash quotidiennes avec rotation seeded
 */

import { COSMETIC_ITEMS, type ShopItem } from './MonetizationTypes';

class FlashSaleService {
    /**
     * Seed basé sur la date du jour (UTC Epoch Day)
     * Change à minuit UTC chaque jour
     * Stable pour tous les utilisateurs
     */
    private getDailySeed(): number {
        return Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    }

    /**
     * Générateur pseudo-aléatoire seeded (LCG algorithm)
     */
    private seededRandom(seed: number): number {
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        seed = (a * seed + c) % m;
        return seed / m;
    }

    /**
     * Mélange un array avec un seed donné (Fisher-Yates seeded)
     */
    private shuffleSeeded<T>(array: T[], seed: number): T[] {
        const shuffled = [...array];
        let currentSeed = seed;

        for (let i = shuffled.length - 1; i > 0; i--) {
            currentSeed = Math.floor(this.seededRandom(currentSeed) * 1000000);
            const j = Math.floor(this.seededRandom(currentSeed) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }

    /**
     * Obtient les items en flash sale du jour (3-5 items avec discount)
     * Rotation quotidienne basée sur seed
     */
    public getFlashSales(): ShopItem[] {
        const seed = this.getDailySeed();

        // Filtre : seulement les items avec priceCredits > 0 (pas le thème default)
        const eligibleItems = COSMETIC_ITEMS.filter(
            item => item.priceCredits && item.priceCredits > 0
        );

        // Mélange avec seed du jour
        const shuffled = this.shuffleSeeded(eligibleItems, seed);

        // Prend les 3 premiers items
        const flashItems = shuffled.slice(0, 3);

        // Applique des discounts variables (30%, 40%, 50%)
        const discounts = [30, 40, 50];

        return flashItems.map((item, index) => ({
            ...item,
            metadata: {
                ...item.metadata,
                discount: discounts[index],
                originalPrice: item.priceCredits,
            },
            // Recalcule le prix avec discount
            priceCredits: Math.floor((item.priceCredits || 0) * (1 - discounts[index] / 100)),
        }));
    }

    /**
     * Vérifie si un item est en flash sale aujourd'hui
     */
    public isFlashSale(itemId: string): boolean {
        const flashSales = this.getFlashSales();
        return flashSales.some(item => item.id === itemId);
    }

    /**
     * Obtient le temps restant jusqu'au prochain reset (minuit UTC)
     * Retourne { hours, minutes }
     */
    public getTimeUntilReset(): { hours: number; minutes: number } {
        const now = new Date();
        const midnight = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1, // Demain UTC
            0, 0, 0, 0
        ));

        const diff = midnight.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return { hours, minutes };
    }
}

// Export singleton
export default new FlashSaleService();
