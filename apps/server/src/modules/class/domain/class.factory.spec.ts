import { Class } from './class.do';
import { ClassFactory } from './class.factory';

describe('ClassFactory', () => {
	describe('create', () => {
		describe('when creating a new instance', () => {
			it('should create a new instance with default props', () => {
				const result = ClassFactory.create();

				expect(result).toBeInstanceOf(Class);
				expect(result).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						name: '',
						schoolId: '',
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
						userIds: [],
						teacherIds: [],
					})
				);
			});

			it('should create a new instance with custom props', () => {
				const result = ClassFactory.create({
					id: 'id',
					name: 'name',
					schoolId: 'schoolId',
					userIds: ['userId'],
					teacherIds: ['teacherId'],
				});

				expect(result).toBeInstanceOf(Class);
				expect(result).toEqual(
					expect.objectContaining({
						id: 'id',
						name: 'name',
						schoolId: 'schoolId',
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
						userIds: ['userId'],
						teacherIds: ['teacherId'],
					})
				);
			});
		});
	});
});
