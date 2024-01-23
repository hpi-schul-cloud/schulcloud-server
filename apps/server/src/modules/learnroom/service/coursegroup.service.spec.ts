import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseGroupRepo, UserRepo } from '@shared/repo';
import { courseGroupFactory, setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DomainModel, OperationModel } from '@shared/domain/types';
import { CourseGroupService } from './coursegroup.service';

describe('CourseGroupService', () => {
	let module: TestingModule;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let courseGroupService: CourseGroupService;
	let userRepo: DeepMocked<UserRepo>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CourseGroupService,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: CourseGroupRepo,
					useValue: createMock<CourseGroupRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		courseGroupRepo = module.get(CourseGroupRepo);
		courseGroupService = module.get(CourseGroupService);
		userRepo = module.get(UserRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findAllCourseGroupsByUserId', () => {
		describe('when finding by userId', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const courseGroups = courseGroupFactory.buildListWithId(2, { students: [user] });

				userRepo.findById.mockResolvedValue(user);
				courseGroupRepo.findByUserId.mockResolvedValue([courseGroups, courseGroups.length]);

				return {
					user,
					courseGroups,
				};
			};

			it('should call courseGroupRepo.findByUserId', async () => {
				const { user } = setup();

				await courseGroupService.findAllCourseGroupsByUserId(user.id);

				expect(courseGroupRepo.findByUserId).toBeCalledWith(user.id);
			});

			it('should return array with coursesGroup with userId', async () => {
				const { user, courseGroups } = setup();

				const [courseGroup] = await courseGroupService.findAllCourseGroupsByUserId(user.id);

				expect(courseGroup.length).toEqual(2);
				expect(courseGroup).toEqual(courseGroups);
			});
		});
	});

	describe('when deleting by userId', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const courseGroup1 = courseGroupFactory.buildWithId({ students: [user] });
			const courseGroup2 = courseGroupFactory.buildWithId({ students: [user] });

			userRepo.findById.mockResolvedValue(user);
			courseGroupRepo.findByUserId.mockResolvedValue([[courseGroup1, courseGroup2], 2]);

			const expectedResult = DomainOperationBuilder.build(DomainModel.COURSEGROUP, OperationModel.UPDATE, 2, [
				courseGroup1.id,
				courseGroup2.id,
			]);

			return {
				expectedResult,
				user,
			};
		};

		it('should call courseGroupRepo.findByUserId', async () => {
			const { user } = setup();

			await courseGroupService.deleteUserDataFromCourseGroup(user.id);

			expect(courseGroupRepo.findByUserId).toBeCalledWith(user.id);
		});

		it('should update courses without deleted user', async () => {
			const { expectedResult, user } = setup();

			const result = await courseGroupService.deleteUserDataFromCourseGroup(user.id);

			expect(result).toEqual(expectedResult);
		});
	});
});
