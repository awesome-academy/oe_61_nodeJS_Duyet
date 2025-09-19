export function toLocaleDateStringByLang(date: string | Date, lang: string) {
  const locale = lang === 'vi' ? 'vi-VN' : lang;
  return new Date(date).toLocaleDateString(locale, {
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}
