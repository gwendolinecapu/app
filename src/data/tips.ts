export interface SystemTip {
    id: string;
    content: string;
    category: 'management' | 'wellness' | 'communication';
    type: 'tip';
}

export const SYSTEM_TIPS: SystemTip[] = [
    {
        id: 'tip_1',
        content: "💡 Conseil Système : Tenez un journal commun pour faciliter la communication entre alters. Même quelques mots par jour aident !",
        category: 'communication',
        type: 'tip'
    },
    {
        id: 'tip_2',
        content: "🌿 Bien-être : Si vous vous sentez dissocié, essayez la technique du 5-4-3-2-1 : 5 choses que vous voyez, 4 que vous touchez, 3 que vous entendez...",
        category: 'wellness',
        type: 'tip'
    },
    {
        id: 'tip_3',
        content: "🤝 Organisation : Utilisez des étiquettes ou des codes couleurs pour marquer les affaires de chacun (tasses, carnets...).",
        category: 'management',
        type: 'tip'
    },
    {
        id: 'tip_4',
        content: "🛡️ Sécurité : Définissez des règles de sécurité simples pour le système (ex: pas de dépenses > 50€ sans vote).",
        category: 'management',
        type: 'tip'
    },
    {
        id: 'tip_5',
        content: "🗣️ Communication : Laissez des post-its dans la maison pour communiquer avec ceux qui ne regardent pas le téléphone.",
        category: 'communication',
        type: 'tip'
    }
];
