import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletionInjectionService,
} from '@modules/deletion';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CourseEntity, CourseGroupEntity, CourseGroupRepo } from '../../repo';
import { courseGroupEntityFactory } from '../../testing';
import { CourseGroupService } from './coursegroup.service';

describe('CourseGroupService', () => {
	let module: TestingModule;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let courseGroupService: CourseGroupService;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);
		module = await Test.createTestingModule({
			providers: [
				CourseGroupService,
				{
					provide: CourseGroupRepo,
					useValue: createMock<CourseGroupRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: UserDeletionInjectionService,
					useValue: createMock<UserDeletionInjectionService>({
						injectUserDeletionService: jest.fn(),
					}),
				},
			],
		}).compile();
		courseGroupRepo = module.get(CourseGroupRepo);
		courseGroupService = module.get(CourseGroupService);
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
				const courseGroups = courseGroupEntityFactory.buildListWithId(2, { students: [user] });

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
			const courseGroup1 = courseGroupEntityFactory.buildWithId({ students: [user] });
			const courseGroup2 = courseGroupEntityFactory.buildWithId({ students: [user] });

			courseGroupRepo.findByUserId.mockResolvedValue([[courseGroup1, courseGroup2], 2]);

			const expectedResult = DomainDeletionReportBuilder.build(DomainName.COURSEGROUP, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [courseGroup1.id, courseGroup2.id]),
			]);

			return {
				expectedResult,
				user,
			};
		};

		it('should call courseGroupRepo.findByUserId', async () => {
			const { user } = setup();

			await courseGroupService.deleteUserData(user.id);

			expect(courseGroupRepo.findByUserId).toBeCalledWith(user.id);
		});

		it('should update courses without deleted user', async () => {
			const { expectedResult, user } = setup();

			const result = await courseGroupService.deleteUserData(user.id);

			expect(result).toEqual(expectedResult);
		});
	});

	describe('deleteUserData', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const courseGroup1 = courseGroupEntityFactory.buildWithId({ students: [user] });
			const courseGroup2 = courseGroupEntityFactory.buildWithId({ students: [user] });

			courseGroupRepo.findByUserId.mockResolvedValue([[courseGroup1, courseGroup2], 2]);

			const expectedResult = DomainDeletionReportBuilder.build(DomainName.COURSEGROUP, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [courseGroup1.id, courseGroup2.id]),
			]);

			return {
				expectedResult,
				user,
			};
		};

		it('should call courseGroupRepo.findByUserId', async () => {
			const { user } = setup();

			await courseGroupService.deleteUserData(user.id);

			expect(courseGroupRepo.findByUserId).toBeCalledWith(user.id);
		});

		it('should call repo.removeUserReference', async () => {
			const { user } = setup();

			await courseGroupService.deleteUserData(user.id);

			expect(courseGroupRepo.removeUserReference).toBeCalledWith(user.id);
		});

		it('should return DomainDeletionReport ', async () => {
			const { expectedResult, user } = setup();

			const result = await courseGroupService.deleteUserData(user.id);

			expect(result).toEqual(expectedResult);
		});
	});
});
