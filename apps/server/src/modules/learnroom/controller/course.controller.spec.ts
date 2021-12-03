import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, ICurrentUser, Counted, Course } from '@shared/domain';
import { PaginationQuery } from '@shared/controller';
import { CourseUc } from '../uc/course.uc';
import { CourseController } from './course.controller';

describe('course controller', () => {
	let controller: CourseController;
	let uc: CourseUc;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				CourseController,
				{
					provide: CourseUc,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findAllByUser(userId: EntityId, options?: PaginationQuery): Promise<Counted<Course[]>> {
							throw new Error('Please write a mock for CourseUc.findByUser.');
						},
					},
				},
			],
		}).compile();

		uc = module.get(CourseUc);
		controller = module.get(CourseController);
	});

	describe('findForUser', () => {
		it('should call uc', async () => {
			const spy = jest
				.spyOn(uc, 'findAllByUser')
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((userId: EntityId, options?: PaginationQuery) => {
					const courses = new Array(5).map(() => ({} as Course));
					return Promise.resolve([courses, 5]);
				});
			const currentUser = { userId: 'userId' } as ICurrentUser;
			await controller.findForUser(currentUser, { skip: 0, limit: 50 });

			expect(spy).toHaveBeenCalledWith('userId', { skip: 0, limit: 50 });
		});

		it('should map result to response', async () => {
			const courseMock = {
				getMetadata: () => {
					return {
						id: 'courseId',
						name: 'courseName',
						shortName: 'co',
						displayColor: '#ACACAC',
					};
				},
			} as Course;

			jest
				.spyOn(uc, 'findAllByUser')
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((userId: EntityId, options?: PaginationQuery) => {
					return Promise.resolve([[courseMock], 1]);
				});
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const result = await controller.findForUser(currentUser, { skip: 0, limit: 100 });

			expect(result.total).toEqual(1);
			expect(result.data[0].title).toEqual('courseName');
		});
	});
});
