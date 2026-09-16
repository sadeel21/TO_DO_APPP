/**
 * Short Arabic encouragement shown when a task is marked complete.
 * Add more strings here — pickNextPhrase skips the last one used.
 */
export const MOTIVATIONAL_PHRASES = [
  'أحسنت! خطوة كمان لهدفك 💪',
  'الله يعطيك العافية!',
  'استمر، انت ماشي منيح',
  'تمام، هيك بنمشي ✨',
  'ما شاء الله، شغلك واضح',
  'كل مهمة بتقربك أكثر',
  'ثابر، النتيجة بتيجي',
  'يا سلام، أنجزت!',
  'بارك الله فيك، كمّل بهالهمة',
  'خطوة ثابتة اليوم، فرق كبير بكرا',
  'أنت قدّها، كمّل بهدوء',
  'الحمد لله، تقدّم حلو',
];

export function pickNextPhrase(previous) {
  const pool = MOTIVATIONAL_PHRASES.filter((phrase) => phrase !== previous);
  const list = pool.length > 0 ? pool : MOTIVATIONAL_PHRASES;
  return list[Math.floor(Math.random() * list.length)];
}
