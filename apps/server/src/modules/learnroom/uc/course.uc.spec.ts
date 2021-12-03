import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo } from '@shared/repo';
import { Course, Counted, EntityId, IFindOptions, SortOrder } from '@shared/domain';
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
						findAllByUserId(userId: EntityId, filters?, options?: IFindOptions<Course>): Promise<Counted<Course[]>> {
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

			const [array, count] = await service.findAllByUser('someUserId');
			expect(count).toEqual(5);
			expect(array).toEqual(courses);
		});

		it('should pass on options correctly', async () => {
			const courses = new Array(5).map(() => ({} as Course));
			const spy = jest.spyOn(repo, 'findAllByUserId').mockImplementation((userId: EntityId) => {
				return Promise.resolve([courses, 5]);
			});

			const pagination = { skip: 1, limit: 2 };
			const resultingOptions = { pagination, order: { name: SortOrder.asc } };

			const [array, count] = await service.findAllByUser('someUserId', pagination);

			expect(spy).toHaveBeenCalledWith('someUserId', {}, resultingOptions);
		});
	});
});
