import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseGroupRepo, UserRepo } from '@shared/repo';
import { courseGroupFactory, setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { DomainName, OperationType } from '@shared/domain/types';
import { EventBus } from '@nestjs/cqrs';
import { ObjectId } from 'bson';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { DataDeletedEvent } from '@modules/deletion';
import { CourseGroupService } from './coursegroup.service';

describe('CourseGroupService', () => {
	let module: TestingModule;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let courseGroupService: CourseGroupService;
	let userRepo: DeepMocked<UserRepo>;
	let eventBus: DeepMocked<EventBus>;

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
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
			],
		}).compile();
		courseGroupRepo = module.get(CourseGroupRepo);
		courseGroupService = module.get(CourseGroupService);
		userRepo = module.get(UserRepo);
		eventBus = module.get(EventBus);
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

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.FILERECORDS;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in courseGroupService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(courseGroupService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await courseGroupService.handle({ deletionRequestId, targetRefId });

				expect(courseGroupService.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(courseGroupService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await courseGroupService.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
