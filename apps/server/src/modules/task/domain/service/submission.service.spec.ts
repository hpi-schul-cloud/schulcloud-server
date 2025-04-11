import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FileRecordParentType } from '@infra/rabbitmq';
import { MikroORM } from '@mikro-orm/core';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Counted } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { Submission, SubmissionRepo, Task } from '../../repo';
import { submissionFactory, taskFactory } from '../../testing';
import { SubmissionService } from './submission.service';

describe('Submission Service', () => {
	let module: TestingModule;
	let service: SubmissionService;
	let submissionRepo: DeepMocked<SubmissionRepo>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		const orm = await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);

		module = await Test.createTestingModule({
			imports: [],
			providers: [
				SubmissionService,
				{
					provide: SubmissionRepo,
					useValue: createMock<SubmissionRepo>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
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
				{
					provide: MikroORM,
					useValue: orm,
				},
			],
		}).compile();

		service = module.get(SubmissionService);
		submissionRepo = module.get(SubmissionRepo);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		eventBus = module.get(EventBus);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findById is called', () => {
		describe('repo returns successfully', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();

				submissionRepo.findById.mockResolvedValueOnce(submission);

				return { submission };
			};

			it('should return submission', async () => {
				const { submission } = setup();

				const result = await service.findById(submission.id);

				expect(submissionRepo.findById).toHaveBeenCalledWith(submission.id);
				expect(result).toEqual(submission);
			});
		});

		describe('repo returns error', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const error = new Error();

				submissionRepo.findById.mockRejectedValue(error);

				return { submission, error };
			};

			it('should pass error', async () => {
				const { submission, error } = setup();

				await expect(service.findById(submission.id)).rejects.toThrow(error);
			});
		});
	});

	describe('findAllByTask is called', () => {
		const createParams = () => {
			const task = taskFactory.buildWithId();

			const submission1 = submissionFactory.buildWithId();
			const submission2 = submissionFactory.buildWithId();
			const submissions = [submission1, submission2];
			const countedSubmissions: Counted<Submission[]> = [submissions, 2];

			return { task, countedSubmissions };
		};

		describe('WHEN repo returns successfully', () => {
			const setup = () => {
				const { task, countedSubmissions } = createParams();

				submissionRepo.findAllByTaskIds.mockResolvedValueOnce(countedSubmissions);

				return { taskId: task.id, countedSubmissions };
			};

			it('should call findAllByTaskIds', async () => {
				const { taskId } = setup();

				await service.findAllByTask(taskId);

				expect(submissionRepo.findAllByTaskIds).toHaveBeenCalledWith([taskId]);
			});

			it('should return submissions', async () => {
				const { taskId, countedSubmissions } = setup();

				const result = await service.findAllByTask(taskId);

				expect(result).toEqual(countedSubmissions);
			});
		});

		describe('WHEN repo throws error', () => {
			const setup = () => {
				const { task, countedSubmissions } = createParams();
				const error = new Error();

				submissionRepo.findAllByTaskIds.mockRejectedValueOnce(error);

				return { taskId: task.id, countedSubmissions, error };
			};

			it('should pass error', async () => {
				const { taskId, error } = setup();

				await expect(service.findAllByTask(taskId)).rejects.toThrow(error);
			});
		});
	});

	describe('delete is called', () => {
		describe('delets successfully', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const fileDto = new FileDto({
					id: 'id',
					name: 'name',
					parentType: FileRecordParentType.Submission,
					parentId: 'parentId',
				});

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([fileDto]);
				submissionRepo.delete.mockResolvedValueOnce();

				return { submission };
			};

			it('should resolve successfully', async () => {
				const { submission } = setup();

				await service.delete(submission);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(submission.id);
				expect(submissionRepo.delete).toHaveBeenCalledWith(submission);
			});
		});

		describe('deleteFilesOfParent rejects with error', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const error = new Error();

				filesStorageClientAdapterService.deleteFilesOfParent.mockRejectedValueOnce(error);

				return { submission, error };
			};

			it('should pass error', async () => {
				const { submission, error } = setup();

				await expect(service.delete(submission)).rejects.toThrow(error);
			});
		});

		describe('submissionRepo rejects with error', () => {
			const setup = () => {
				const submission = submissionFactory.buildWithId();
				const fileDto = new FileDto({
					id: 'id',
					name: 'name',
					parentType: FileRecordParentType.Submission,
					parentId: 'parentId',
				});
				const error = new Error();

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([fileDto]);
				submissionRepo.delete.mockRejectedValueOnce(error);

				return { submission, error };
			};

			it('should pass error', async () => {
				const { submission, error } = setup();

				await expect(service.delete(submission)).rejects.toThrow(error);
			});
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

				const result = await service.deleteSingleSubmissionsOwnedByUser(new ObjectId().toString());

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

				const result = await service.deleteSingleSubmissionsOwnedByUser(user.id);

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

				const result = await service.removeUserReferencesFromSubmissions(new ObjectId().toString());

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

				const result = await service.removeUserReferencesFromSubmissions(user1.id);

				expect(result.count).toEqual(1);
				expect(result.refs.length).toEqual(1);
			});

			it('should call repo removeUserReference', async () => {
				const { submission, user1 } = setup();

				await service.removeUserReferencesFromSubmissions(user1.id);

				expect(submissionRepo.removeUserReference).toHaveBeenCalledWith([submission.id]);
			});

			it('should call repo deleteUserFromTeam', async () => {
				const { user1 } = setup();

				await service.removeUserReferencesFromSubmissions(user1.id);

				expect(submissionRepo.deleteUserFromGroupSubmissions).toHaveBeenCalledWith(user1.id);
			});
		});
	});

	describe('deleteUserData', () => {
		const setup = () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const submission1 = submissionFactory.buildWithId({ student: user1, teamMembers: [user1] });
			const submission2 = submissionFactory.buildWithId({
				student: user1,
				teamMembers: [user1, user2],
			});

			submissionRepo.findAllByUserId.mockResolvedValueOnce([[submission1, submission2], 2]);

			const expectedResultForOwner = DomainOperationReportBuilder.build(OperationType.DELETE, 1, [submission1.id]);

			const expectedResultForUsersPermission = DomainOperationReportBuilder.build(OperationType.DELETE, 1, [
				submission2.id,
			]);

			const expectedResult = DomainDeletionReportBuilder.build(DomainName.SUBMISSIONS, [
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
			jest.spyOn(service, 'deleteSingleSubmissionsOwnedByUser').mockResolvedValueOnce(expectedResultForOwner);

			await service.deleteUserData(user1.id);

			expect(service.deleteSingleSubmissionsOwnedByUser).toHaveBeenCalledWith(user1.id);
		});

		it('should call removeUserReferencesFromSubmissions with userId', async () => {
			const { user1, expectedResultForUsersPermission } = setup();
			jest
				.spyOn(service, 'removeUserReferencesFromSubmissions')
				.mockResolvedValueOnce(expectedResultForUsersPermission);

			await service.deleteUserData(user1.id);

			expect(service.removeUserReferencesFromSubmissions).toHaveBeenCalledWith(user1.id);
		});

		it('should return domainOperation object with information about deleted user data', async () => {
			const { user1, expectedResultForOwner, expectedResultForUsersPermission, expectedResult } = setup();

			jest.spyOn(service, 'deleteSingleSubmissionsOwnedByUser').mockResolvedValueOnce(expectedResultForOwner);
			jest
				.spyOn(service, 'removeUserReferencesFromSubmissions')
				.mockResolvedValueOnce(expectedResultForUsersPermission);

			const result = await service.deleteUserData(user1.id);

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
			it('should call deleteUserData in classService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(service.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
