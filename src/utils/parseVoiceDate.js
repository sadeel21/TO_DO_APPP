/**
 * Keyword parsing (not NLP): map spoken English/Arabic date words to YYYY-MM-DD.
 *
 * Longer phrases are matched first so "day after tomorrow" does not become "tomorrow".
 */
function pad(value) {
  return String(value).padStart(2, '0');
}

export function localDateKey(daysFromToday = 0, from = new Date()) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() + daysFromToday);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DATE_RULES = [
  { days: 2, pattern: /\bday after tomorrow\b/gi },
  { days: 1, pattern: /\btomorrow\b/gi },
  { days: 0, pattern: /\b(today|tonight)\b/gi },
  { days: 2, pattern: /بعد\s*بكر[ةا]|بعد\s*غد[اأآ]?ً?/g },
  { days: 1, pattern: /بكر[ةا]|غدًا|غداً|غدا|الغد/g },
  { days: 0, pattern: /اليوم|الليلة|الليله/g },
];

export function parseVoiceDate(raw) {
  const source = String(raw || '').trim();
  if (!source) {
    return { text: '', dueDate: null };
  }

  let dueDate = null;
  let text = source;

  for (const rule of DATE_RULES) {
    if (!rule.pattern.test(text)) {
      rule.pattern.lastIndex = 0;
      continue;
    }
    rule.pattern.lastIndex = 0;
    dueDate = localDateKey(rule.days);
    text = text.replace(rule.pattern, ' ');
    break;
  }

  text = text.replace(/\s+/g, ' ').trim();
  return { text: text || source.trim(), dueDate };
}
