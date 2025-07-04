import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { ContentMetadata, H5PContent, H5PContentProperties } from '../repo';
import { H5PContentParentType } from '../types';

class H5PContentFactory extends BaseFactory<H5PContent, H5PContentProperties> {}

export const h5pContentFactory = H5PContentFactory.define(H5PContent, ({ sequence }) => {
	const content: H5PContentProperties = {
		id: new ObjectId().toHexString(),
		parentType: H5PContentParentType.Lesson,
		parentId: new ObjectId().toHexString(),
		creatorId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		content: {
			field: sequence,
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

	return content;
});
