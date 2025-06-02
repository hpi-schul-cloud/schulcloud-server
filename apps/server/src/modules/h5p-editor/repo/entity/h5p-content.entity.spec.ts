import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { H5pEditorContentInvalidIdLoggableException } from '../../loggable';
import { H5PContentParentType } from '../../types';
import { ContentMetadata, H5PContent, H5PContentProperties } from './h5p-content.entity';

describe(H5PContent.name, () => {
	describe('when a H5PContent instance is created', () => {
		const setup = () => {
			const props: H5PContentProperties = {
				creatorId: new ObjectId().toHexString(),
				parentType: H5PContentParentType.Lesson,
				parentId: new ObjectId().toHexString(),
				schoolId: new ObjectId().toHexString(),
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

			return { props };
		};

		it('should create a H5PContent', () => {
			const { props } = setup();

			const result = new H5PContent(props);

			expect(result).toBeInstanceOf(H5PContent);
			expect(result).toEqual(expect.objectContaining<Partial<H5PContent>>({ ...props }));
		});
	});

	describe('when a H5PContent instance is created with the provided id', () => {
		const setup = (id: EntityId) => {
			const props: H5PContentProperties = {
				id,
				creatorId: new ObjectId().toHexString(),
				parentType: H5PContentParentType.BoardElement,
				parentId: new ObjectId().toHexString(),
				schoolId: new ObjectId().toHexString(),
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

			return { props };
		};

		describe('when the id provided is a valid mongo id', () => {
			it('should create an H5PContent with the provided id', () => {
				const { props } = setup(new ObjectId().toHexString());

				const result = new H5PContent(props);

				expect(result).toBeInstanceOf(H5PContent);
				expect(result.id).toEqual(props.id);
				expect(result._id).toEqual(new ObjectId(props.id));
				expect(result).toEqual(expect.objectContaining<Partial<H5PContent>>({ ...props }));
			});
		});

		describe('when the id provided is an invalid mongo id', () => {
			it('should throw an H5pEditorContentInvalidIdLoggableException', () => {
				const invalidId = 'abc';
				const { props } = setup(invalidId);

				expect(() => new H5PContent(props)).toThrow(new H5pEditorContentInvalidIdLoggableException(invalidId));
			});
		});
	});
});
