import { ITranslationFunction } from '@lumieducation/h5p-server';
import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';
import path from 'path';
import { translatorConfig } from '../h5p-editor.config';

export const Translator = {
	async translate() {
		const lumiPackagePath = path.dirname(require.resolve('@lumieducation/h5p-server/package.json'));
		const pathBackend = path.join(lumiPackagePath, 'build/assets/translations/{{ns}}/{{lng}}.json');

		const translationFunction = await i18next.use(i18nextFsBackend).init({
			backend: {
				loadPath: pathBackend,
			},
			ns: [
				'client',
				'copyright-semantics',
				'hub',
				'library-metadata',
				'metadata-semantics',
				'mongo-s3-content-storage',
				's3-temporary-storage',
				'server',
				'storage-file-implementations',
			],
			preload: translatorConfig.AVAILABLE_LANGUAGES,
		});

		const translate: ITranslationFunction = (key, language) => translationFunction(key, { lng: language });

		return translate;
	},
};
