import { ValkeyClient } from '@infra/valkey-client/clients';
import KeyvValkey from '@keyv/valkey';
import { H5PEditor, cacheImplementations } from '@lumieducation/h5p-server';
import CachedLibraryStorage from '@lumieducation/h5p-server/build/src/implementation/cache/CachedLibraryStorage';
import { IH5PEditorOptions, ITranslationFunction } from '@lumieducation/h5p-server/build/src/types';
import { createCache } from 'cache-manager';
import Keyv from 'keyv';
import { CACHE_TOKEN } from '../h5p-editor.config';
import { ContentStorage, LibraryStorage, TemporaryFileStorage, Translator } from '../service';
import { h5pConfig, h5pUrlGenerator } from '../service/config/h5p-service-config';
import EditorPermissionSystem from './editor-permission-system';


export const H5PEditorProvider = {
	provide: H5PEditor,
	inject: [ContentStorage, LibraryStorage, TemporaryFileStorage, CACHE_TOKEN],
	async useFactory(
		contentStorage: ContentStorage,
		libraryStorage: LibraryStorage,
		temporaryStorage: TemporaryFileStorage,
		cacheClient: ValkeyClient
	): Promise<H5PEditor> {
		const cacheAdapter = createCache({
			stores: [
				new Keyv({
					store: new KeyvValkey(cacheClient.valkeyInstance),
				}),
			],
		});
		const cache = new cacheImplementations.CachedKeyValueStorage('kvcache');
		const libraryCache = new cacheImplementations.CachedLibraryStorage(
			new CachedLibraryStorage(libraryStorage, cacheAdapter)
		);

		const permissionSystem = new EditorPermissionSystem();
		const h5pOptions: IH5PEditorOptions = {
			enableHubLocalization: true,
			enableLibraryNameLocalization: true,
			permissionSystem,
		};
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const translationFunction: ITranslationFunction = await Translator.translate();
		const h5pEditor = new H5PEditor(
			cache,
			h5pConfig,
			libraryCache,
			contentStorage,
			temporaryStorage,
			translationFunction,
			h5pUrlGenerator,
			h5pOptions
		);
		h5pEditor.setRenderer((model) => model);

		return h5pEditor;
	},
};
