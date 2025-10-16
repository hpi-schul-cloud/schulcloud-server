import { EntityManager, MetadataStorage } from '@mikro-orm/core';
import { getFieldName } from './repo-helper';

describe('getFieldName', () => {
	let em: EntityManager;
	let metadata: MetadataStorage;

	const setup = () => {
		metadata = {
			find: jest.fn().mockReturnValue({
				properties: {
					students: {
						fieldNames: ['students_id'],
					},
				},
			}),
		} as unknown as MetadataStorage;

		em = {
			getMetadata: jest.fn().mockReturnValue(metadata),
		} as unknown as EntityManager;
	};

	it('should return the correct field name', () => {
		setup();
		const fieldName = getFieldName(em, 'students', 'CourseGroupEntity');
		expect(fieldName).toBe('students_id');
	});

	it('should throw an error if the prop is not found', () => {
		jest.spyOn(metadata, 'find').mockImplementation().mockReturnValueOnce(undefined);

		expect(() => getFieldName(em, 'students', 'CourseGroupEntity')).toThrow('Field name for students not found.');
	});
});
