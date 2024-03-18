import {
	ContentMetadata,
	H5PContent,
	H5PContentParentType,
	H5PContentProperties,
} from '@src/modules/h5p-editor/entity';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from './base.factory';

class H5PContentFactory extends BaseFactory<H5PContent, H5PContentProperties> {}

export const h5pContentFactory = H5PContentFactory.define(H5PContent, ({ sequence }) => {
	return {
		parentType: H5PContentParentType.Lesson,
		parentId: new ObjectId().toHexString(),
		creatorId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
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
