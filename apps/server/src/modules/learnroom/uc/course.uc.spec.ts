import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo } from '@shared/repo';
import { Course, Counted, EntityId, IFindOptions, SortOrder } from '@shared/domain';
import { userFactory, courseFactory, cleanUpCollections } from '@shared/testing';
import { CourseUc } from './course.uc';

describe('course uc', () => {
	let service: CourseUc;
	let repo: CourseRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CourseUc,
				{
					provide: CourseRepo,
					useValue: {
						findAllByUserId(userId: EntityId, options?: IFindOptions<Course>): Promise<Counted<Course[]>> {
							throw new Error('Please write a mock for TaskRepo.findAllByParentIds');
						},
					},
				},
			],
		}).compile();

		service = module.get(CourseUc);
		repo = module.get(CourseRepo);
	});

	describe('findByUser', () => {
		it('should return courses of user', async () => {
			const courses = new Array(5).map(() => ({} as Course));
			const spy = jest.spyOn(repo, 'findAllByUserId').mockImplementation((userId: EntityId) => {
				return Promise.resolve([courses, 5]);
			});

			const [array, count] = await service.findByUser('someUserId');
			expect(count).toEqual(5);
			expect(array).toEqual(courses);

			expect(spy).toHaveBeenCalledWith('someUserId', undefined);
		});

		it('should pass on options correctly', async () => {
			const courses = new Array(5).map(() => ({} as Course));
			const spy = jest.spyOn(repo, 'findAllByUserId').mockImplementation((userId: EntityId) => {
				return Promise.resolve([courses, 5]);
			});

			const options = { pagination: { skip: 1, limit: 2 }, order: { name: SortOrder.asc } };

			const [array, count] = await service.findByUser('someUserId', options);

			expect(spy).toHaveBeenCalledWith('someUserId', options);
		});
	});
});
