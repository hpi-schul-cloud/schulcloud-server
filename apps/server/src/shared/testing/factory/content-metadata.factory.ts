import { IContentMetadata } from '@lumieducation/h5p-server';
import { ContentMetadata } from '@src/modules/h5p-editor/contentStorage/contentMetadata.entity';
import { BaseFactory } from './base.factory';

class ContentMetadataFactory extends BaseFactory<ContentMetadata, { contentId: string; metadata: IContentMetadata }> {}

export const contentMetadataFactory = ContentMetadataFactory.define(ContentMetadata, ({ sequence }) => {
	return {
		contentId: `CONTENT${sequence.toString()}`,
		metadata: {
			defaultLanguage: 'de-de',
			embedTypes: ['iframe'],
			language: 'de-de',
			license: `License #${sequence}`,
			mainLibrary: `License-${sequence}.0`,
			preloadedDependencies: [],
			title: `Title #${sequence}`,
		} satisfies IContentMetadata,
	};
});
