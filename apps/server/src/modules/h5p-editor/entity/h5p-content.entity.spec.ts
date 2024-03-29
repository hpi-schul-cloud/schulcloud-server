import { ObjectId } from '@mikro-orm/mongodb';
import { ContentMetadata, H5PContent, H5PContentParentType, H5PContentProperties } from './h5p-content.entity';

describe('H5PContent class', () => {
	describe('when an H5PContent instance is created', () => {
		const setup = () => {
			const dummyH5PContentProperties: H5PContentProperties = {
				creatorId: '507f1f77bcf86cd799439011',
				parentType: H5PContentParentType.Lesson,
				parentId: '507f1f77bcf86cd799439012',
				schoolId: '507f1f77bcf86cd799439013',
				metadata: new ContentMetadata({
					embedTypes: ['iframe'],
					language: 'en',
					mainLibrary: 'mainLibrary123',
					defaultLanguage: 'en',
					license: 'MIT',
					title: 'Title Example',
					preloadedDependencies: [],
					dynamicDependencies: [],
					editorDependencies: [],
				}),
				content: {},
			};

			const h5pContent = new H5PContent(dummyH5PContentProperties);
			return { h5pContent, dummyH5PContentProperties };
		};

		it('should correctly return the creatorId', () => {
			const { h5pContent, dummyH5PContentProperties } = setup();
			const expectedCreatorId = new ObjectId(dummyH5PContentProperties.creatorId).toHexString();
			expect(h5pContent.creatorId).toBe(expectedCreatorId);
		});

		it('should correctly return the schoolId', () => {
			const { h5pContent, dummyH5PContentProperties } = setup();
			const expectedSchoolId = new ObjectId(dummyH5PContentProperties.schoolId).toHexString();
			expect(h5pContent.schoolId).toBe(expectedSchoolId);
		});
	});
});
