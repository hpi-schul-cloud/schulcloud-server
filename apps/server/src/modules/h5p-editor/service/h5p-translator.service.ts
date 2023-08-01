import i18next from 'i18next';
import path from 'path';
import { ITranslationFunction } from '@lumieducation/h5p-server/build/src/types';
import i18nextFsBackend from 'i18next-fs-backend';

export const Translator = {
	async translate() {
		const pathBackend = path.join(
			__dirname,
			'../../../../../../node_modules/@lumieducation/h5p-server/build/assets/translations/{{ns}}/{{lng}}.json'
		);

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
			preload: ['es', 'de', 'en', 'uk'],
		});

		const translate: ITranslationFunction = (key, language) => translationFunction(key, { lng: language });

		return translate;
	},
};
