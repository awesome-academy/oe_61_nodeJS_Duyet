import { I18nService } from 'nestjs-i18n';

export function tGroup(i18n: I18nService, prefix: string, lang: string) {
  return (key: string, args: Record<string, any> = {}) =>
    i18n.t(`${prefix}.${key}`, { lang, args });
}
