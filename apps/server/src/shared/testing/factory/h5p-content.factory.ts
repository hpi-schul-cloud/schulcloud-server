import { ContentMetadata, H5PContent } from '@src/modules/h5p-editor/entity';
import { BaseFactory } from './base.factory';

class H5PContentFactory extends BaseFactory<H5PContent, { metadata: ContentMetadata; content: unknown }> {}

export const h5pContentFactory = H5PContentFactory.define(H5PContent, ({ sequence }) => {
	return {
		content: {
			[`field${sequence}`]: sequence,
			dateField: new Date(sequence),
			thisObjectHasNoStructure: true,
			nested: {
				works: true,
			},
		},
		metadata: new ContentMetadata({
			defaultLanguage: 'de-de',
			embedTypes: ['iframe'],
			language: 'de-de',
			license: `License #${sequence}`,
			mainLibrary: `Library-${sequence}.0`,
			preloadedDependencies: [],
			title: `Title #${sequence}`,
		}),
	};
});
