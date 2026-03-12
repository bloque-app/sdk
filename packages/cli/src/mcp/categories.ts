export const CATEGORY_PRESETS: Record<string, string[]> = {
  food: ['5411', '5412', '5441', '5451', '5462', '5499', '5812', '5813', '5814'],
  transport: ['4111', '4121', '4131', '4784', '5541', '5542', '7512'],
  entertainment: ['7832', '7841', '7911', '7922', '7929', '7932', '7933', '7941'],
  health: ['5912', '8011', '8021', '8031', '8041', '8042', '8043', '8049', '8050', '8062'],
  shopping: ['5311', '5331', '5399', '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699'],
  ads: ['7311', '7312', '7372', '7375', '5734'],
  travel: [
    '3000', '3001', '3002', '3003', '3004', '3005', '3006', '3007', '3008', '3009', '3010',
    '4411', '4511', '4722', '7011', '7012', '7032', '7033',
  ],
  subscriptions: ['5815', '5816', '5817', '5818', '4899'],
};

export function resolveMccs(
  categories?: string[],
  rawMccs?: string[],
): string[] {
  const mccs = new Set<string>();
  if (categories) {
    for (const cat of categories) {
      const preset = CATEGORY_PRESETS[cat.toLowerCase()];
      if (preset) {
        for (const code of preset) mccs.add(code);
      }
    }
  }
  if (rawMccs) {
    for (const code of rawMccs) mccs.add(code);
  }
  return [...mccs];
}

export function listCategories(): string[] {
  return Object.keys(CATEGORY_PRESETS);
}
