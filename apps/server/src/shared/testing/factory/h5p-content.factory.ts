import {
	ContentMetadata,
	H5PContent,
	H5PContentParentType,
	IH5PContentProperties,
} from '@src/modules/h5p-editor/entity';
import { ObjectID } from 'bson';
import { BaseFactory } from './base.factory';

class H5PContentFactory extends BaseFactory<H5PContent, IH5PContentProperties> {}

export const h5pContentFactory = H5PContentFactory.define(H5PContent, ({ sequence }) => {
	return {
		parentType: H5PContentParentType.Lesson,
		parentId: new ObjectID().toHexString(),
		creatorId: new ObjectID().toHexString(),
		schoolId: new ObjectID().toHexString(),
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
