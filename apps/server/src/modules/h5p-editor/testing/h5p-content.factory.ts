import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { ContentMetadata, H5PContent, H5PContentProperties, InstalledLibrary } from '../repo';
import { H5PContentParentType } from '../types';

class H5PContentFactory extends BaseFactory<H5PContent, H5PContentProperties> {
	public withMainLibrary(library: InstalledLibrary): this {
		const params = { metadata: { mainLibrary: library.machineName } };

		return this.params(params);
	}

	public addPreloadedDependencies(libraries: InstalledLibrary[]): this {
		const params = {
			metadata: {
				preloadedDependencies: libraries.map((lib) => {
					return {
						machineName: lib.machineName,
						majorVersion: lib.majorVersion,
						minorVersion: lib.minorVersion,
					};
				}),
			},
		};

		return this.params(params);
	}
}

export const h5pContentFactory = H5PContentFactory.define(H5PContent, ({ sequence }) => {
	const content: H5PContentProperties = {
		id: new ObjectId().toHexString(),
		parentType: H5PContentParentType.BoardElement,
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
