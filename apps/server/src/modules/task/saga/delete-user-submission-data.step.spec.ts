import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { LessonEntity, Material } from '@modules/lesson/repo';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { Submission, SubmissionRepo, Task } from '../repo';
import { submissionFactory } from '../testing';
import { DeleteUserSubmissionDataStep } from './delete-user-submission-data.step';

describe(DeleteUserSubmissionDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserSubmissionDataStep;
	let submissionRepo: DeepMocked<SubmissionRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserSubmissionDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: SubmissionRepo,
					useValue: createMock<SubmissionRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserSubmissionDataStep);
		submissionRepo = module.get(SubmissionRepo);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserSubmissionDataStep(sagaService, createMock<SubmissionRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.TASK_SUBMISSION, step);
		});
	});

	describe('deleteSingleSubmissionsOwnedByUser', () => {
		describe('when submission with specified userId was not found ', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();

				submissionRepo.findAllByUserId.mockResolvedValueOnce([[], 0]);

				return { submission };
			};

			it('should return deletedSubmissions number of 0', async () => {
				const { submission } = setup();

				const result = await step.deleteSingleSubmissionsOwnedByUser(new ObjectId().toString());

				expect(result.count).toEqual(0);
				expect(result.refs.length).toEqual(0);
				expect(submission).toBeDefined();
			});
		});

		describe('when submission with specified userId was found ', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user, teamMembers: [user] });

				submissionRepo.findAllByUserId.mockResolvedValueOnce([[submission], 1]);
				submissionRepo.delete.mockResolvedValueOnce();

				return { submission, user };
			};

			it('should return deletedSubmissions number of 1', async () => {
				const { submission, user } = setup();

				const result = await step.deleteSingleSubmissionsOwnedByUser(user.id);

				expect(result.count).toEqual(1);
				expect(result.refs.length).toEqual(1);
				expect(submissionRepo.delete).toBeCalledTimes(1);
				expect(submissionRepo.delete).toHaveBeenCalledWith([submission]);
			});
		});
	});

	describe('removeUserReferencesFromSubmissions', () => {
		describe('when submission with specified userId was not found ', () => {
			const setup = () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({ student: user1, teamMembers: [user1, user2] });

				submissionRepo.findAllByUserId.mockResolvedValueOnce([[], 0]);

				return { submission, user1, user2 };
			};

			it('should return updated submission number of 0', async () => {
				const { submission, user1 } = setup();

				const result = await step.removeUserReferencesFromSubmissions(new ObjectId().toString());

				expect(result.count).toEqual(0);
				expect(result.refs.length).toEqual(0);
				expect(submission.student).toEqual(user1);
				expect(submission.teamMembers.length).toEqual(2);
			});
		});

		describe('when submission with specified userId was found ', () => {
			const setup = () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const submission = submissionFactory.buildWithId({
					student: user1,
					teamMembers: [user1, user2],
				});

				submissionRepo.findAllByUserId.mockResolvedValueOnce([[submission], 1]);

				return { submission, user1, user2 };
			};

			it('should return updated submission number of 1', async () => {
				const { user1 } = setup();

				const result = await step.removeUserReferencesFromSubmissions(user1.id);

				expect(result.count).toEqual(1);
				expect(result.refs.length).toEqual(1);
			});

			it('should call repo removeUserReference', async () => {
				const { submission, user1 } = setup();

				await step.removeUserReferencesFromSubmissions(user1.id);

				expect(submissionRepo.removeUserReference).toHaveBeenCalledWith([submission.id]);
			});

			it('should call repo deleteUserFromTeam', async () => {
				const { user1 } = setup();

				await step.removeUserReferencesFromSubmissions(user1.id);

				expect(submissionRepo.deleteUserFromGroupSubmissions).toHaveBeenCalledWith(user1.id);
			});
		});
	});

	describe('execute', () => {
		const setup = () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const submission1 = submissionFactory.buildWithId({ student: user1, teamMembers: [user1] });
			const submission2 = submissionFactory.buildWithId({
				student: user1,
				teamMembers: [user1, user2],
			});

			submissionRepo.findAllByUserId.mockResolvedValueOnce([[submission1, submission2], 2]);

			const expectedResultForOwner = StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [submission1.id]);

			const expectedResultForUsersPermission = StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [
				submission2.id,
			]);

			const expectedResult = StepReportBuilder.build(ModuleName.TASK_SUBMISSION, [
				expectedResultForOwner,
				expectedResultForUsersPermission,
			]);

			return {
				user1,
				expectedResultForOwner,
				expectedResultForUsersPermission,
				expectedResult,
			};
		};

		it('should call deleteSingleSubmissionsOwnedByUser with userId', async () => {
			const { user1, expectedResultForOwner } = setup();
			jest.spyOn(step, 'deleteSingleSubmissionsOwnedByUser').mockResolvedValueOnce(expectedResultForOwner);

			await step.execute({ userId: user1.id });

			expect(step.deleteSingleSubmissionsOwnedByUser).toHaveBeenCalledWith(user1.id);
		});

		it('should call removeUserReferencesFromSubmissions with userId', async () => {
			const { user1, expectedResultForUsersPermission } = setup();
			jest.spyOn(step, 'removeUserReferencesFromSubmissions').mockResolvedValueOnce(expectedResultForUsersPermission);

			await step.execute({ userId: user1.id });

			expect(step.removeUserReferencesFromSubmissions).toHaveBeenCalledWith(user1.id);
		});

		it('should return domainOperation object with information about deleted user data', async () => {
			const { user1, expectedResultForOwner, expectedResultForUsersPermission, expectedResult } = setup();

			jest.spyOn(step, 'deleteSingleSubmissionsOwnedByUser').mockResolvedValueOnce(expectedResultForOwner);
			jest.spyOn(step, 'removeUserReferencesFromSubmissions').mockResolvedValueOnce(expectedResultForUsersPermission);

			const result = await step.execute({ userId: user1.id });

			expect(result).toEqual(expectedResult);
		});
	});
});
