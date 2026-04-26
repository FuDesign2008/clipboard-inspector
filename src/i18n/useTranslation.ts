import { useCallback, useEffect, useState } from 'react';
import { translations, type Lang } from './translations';

const STORAGE_KEY = 'clipboard-inspector-lang';

function detectLanguage(): Lang {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'en' || stored === 'zh') return stored;
	if (navigator.language.toLowerCase().startsWith('zh')) return 'zh';
	return 'en';
}

export function useTranslation(): {
	t: (key: string, params?: Record<string, string | number>) => string;
	lang: Lang;
	setLang: (newLang: Lang) => void;
} {
	const [lang, setLangState] = useState<Lang>(detectLanguage);

	useEffect(() => {
		const handler = (e: Event): void => {
			const { detail } = e as CustomEvent<Lang>;
			setLangState(detail);
		};
		window.addEventListener('lang-change', handler);
		return () => {
			window.removeEventListener('lang-change', handler);
		};
	}, []);

	const t = useCallback(
		(key: string, params?: Record<string, string | number>): string => {
			const dict = lang === 'zh' ? translations.zh : translations.en;
			let text = dict[key] ?? translations.en[key] ?? key;
			if (params) {
				for (const [k, v] of Object.entries(params)) {
					text = text.replaceAll(`{${k}}`, String(v));
				}
			}
			return text;
		},
		[lang]
	);

	const setLang = useCallback((newLang: Lang): void => {
		setLangState(newLang);
		localStorage.setItem(STORAGE_KEY, newLang);
		window.dispatchEvent(
			new CustomEvent<Lang>('lang-change', { detail: newLang })
		);
	}, []);

	return { t, lang, setLang } as const;
}
