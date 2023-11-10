import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { AccountService } from '@modules/account/services';
import { ClassService } from '@modules/class';
import { CourseGroupService, CourseService } from '@modules/learnroom/service';
import { FilesService } from '@modules/files/service';
import { LessonService } from '@modules/lesson/service';
import { PseudonymService } from '@modules/pseudonym';
import { TeamService } from '@modules/teams';
import { UserService } from '@modules/user';
import { RocketChatService } from '@modules/rocketchat';
import { rocketChatUserFactory } from '@modules/rocketchat-user/domain/testing';
import { RocketChatUser, RocketChatUserService } from '@modules/rocketchat-user';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionLogService } from '../services/deletion-log.service';
import { DeletionRequestService } from '../services';
import { DeletionRequestUc } from './deletion-request.uc';
import { deletionRequestFactory } from '../domain/testing/factory/deletion-request.factory';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';
import { deletionLogFactory } from '../domain/testing/factory/deletion-log.factory';
import { DeletionRequestBodyProps, DeletionRequestLogResponse } from '../controller/dto';

describe(DeletionRequestUc.name, () => {
	let module: TestingModule;
	let uc: DeletionRequestUc;
	let deletionRequestService: DeepMocked<DeletionRequestService>;
	let deletionLogService: DeepMocked<DeletionLogService>;
	let accountService: DeepMocked<AccountService>;
	let classService: DeepMocked<ClassService>;
	let courseGroupService: DeepMocked<CourseGroupService>;
	let courseService: DeepMocked<CourseService>;
	let filesService: DeepMocked<FilesService>;
	let lessonService: DeepMocked<LessonService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let teamService: DeepMocked<TeamService>;
	let userService: DeepMocked<UserService>;
	let rocketChatUserService: DeepMocked<RocketChatUserService>;
	let rocketChatService: DeepMocked<RocketChatService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeletionRequestUc,
				{
					provide: DeletionRequestService,
					useValue: createMock<DeletionRequestService>(),
				},
				{
					provide: DeletionLogService,
					useValue: createMock<DeletionLogService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: ClassService,
					useValue: createMock<ClassService>(),
				},
				{
					provide: CourseGroupService,
					useValue: createMock<CourseGroupService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: FilesService,
					useValue: createMock<FilesService>(),
				},
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
				{
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
				},
				{
					provide: TeamService,
					useValue: createMock<TeamService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: RocketChatUserService,
					useValue: createMock<RocketChatUserService>(),
				},
				{
					provide: RocketChatService,
					useValue: createMock<RocketChatService>(),
				},
			],
		}).compile();

		uc = module.get(DeletionRequestUc);
		deletionRequestService = module.get(DeletionRequestService);
		deletionLogService = module.get(DeletionLogService);
		accountService = module.get(AccountService);
		classService = module.get(ClassService);
		courseGroupService = module.get(CourseGroupService);
		courseService = module.get(CourseService);
		filesService = module.get(FilesService);
		lessonService = module.get(LessonService);
		pseudonymService = module.get(PseudonymService);
		teamService = module.get(TeamService);
		userService = module.get(UserService);
		rocketChatUserService = module.get(RocketChatUserService);
		rocketChatService = module.get(RocketChatService);
		await setupEntities();
	});

	describe('createDeletionRequest', () => {
		describe('when creating a deletionRequest', () => {
			const setup = () => {
				jest.clearAllMocks();
				const deletionRequestToCreate: DeletionRequestBodyProps = {
					targetRef: {
						domain: DeletionDomainModel.USER,
						id: '653e4833cc39e5907a1e18d2',
					},
					deleteInMinutes: 1440,
				};
				const deletionRequest = deletionRequestFactory.build();

				return {
					deletionRequestToCreate,
					deletionRequest,
				};
			};

			it('should call the service to create the deletionRequest', async () => {
				const { deletionRequestToCreate } = setup();

				await uc.createDeletionRequest(deletionRequestToCreate);

				expect(deletionRequestService.createDeletionRequest).toHaveBeenCalledWith(
					deletionRequestToCreate.targetRef.id,
					deletionRequestToCreate.targetRef.domain,
					deletionRequestToCreate.deleteInMinutes
				);
			});

			it('should return the deletionRequestID and deletionPlannedAt', async () => {
				const { deletionRequestToCreate, deletionRequest } = setup();

				deletionRequestService.createDeletionRequest.mockResolvedValueOnce({
					requestId: deletionRequest.id,
					deletionPlannedAt: deletionRequest.deleteAfter,
				});

				const result = await uc.createDeletionRequest(deletionRequestToCreate);

				expect(result).toEqual({
					requestId: deletionRequest.id,
					deletionPlannedAt: deletionRequest.deleteAfter,
				});
			});
		});
	});

	describe('executeDeletionRequests', () => {
		describe('when executing deletionRequests', () => {
			const setup = () => {
				jest.clearAllMocks();
				const deletionRequestToExecute = deletionRequestFactory.build({ deleteAfter: new Date('2023-01-01') });
				const rocketChatUser: RocketChatUser = rocketChatUserFactory.build({
					userId: deletionRequestToExecute.targetRefId,
				});

				classService.deleteUserDataFromClasses.mockResolvedValueOnce(1);
				courseGroupService.deleteUserDataFromCourseGroup.mockResolvedValueOnce(2);
				courseService.deleteUserDataFromCourse.mockResolvedValueOnce(2);
				filesService.markFilesOwnedByUserForDeletion.mockResolvedValueOnce(2);
				filesService.removeUserPermissionsToAnyFiles.mockResolvedValueOnce(2);
				lessonService.deleteUserDataFromLessons.mockResolvedValueOnce(2);
				pseudonymService.deleteByUserId.mockResolvedValueOnce(2);
				teamService.deleteUserDataFromTeams.mockResolvedValueOnce(2);
				userService.deleteUser.mockResolvedValueOnce(1);
				rocketChatUserService.deleteByUserId.mockResolvedValueOnce(1);

				return {
					deletionRequestToExecute,
					rocketChatUser,
				};
			};

			it('should call deletionRequestService.findAllItemsToExecute', async () => {
				await uc.executeDeletionRequests();

				expect(deletionRequestService.findAllItemsToExecute).toHaveBeenCalled();
			});

			it('should call deletionRequestService.markDeletionRequestAsExecuted to update status of deletionRequests', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(deletionRequestService.markDeletionRequestAsExecuted).toHaveBeenCalledWith(deletionRequestToExecute.id);
			});

			it('should call accountService.deleteByUserId to delete user data in account module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(accountService.deleteByUserId).toHaveBeenCalled();
			});

			it('should call classService.deleteUserDataFromClasses to delete user data in class module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(classService.deleteUserDataFromClasses).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call courseGroupService.deleteUserDataFromCourseGroup to delete user data in courseGroup module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(courseGroupService.deleteUserDataFromCourseGroup).toHaveBeenCalledWith(
					deletionRequestToExecute.targetRefId
				);
			});

			it('should call courseService.deleteUserDataFromCourse to delete user data in course module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(courseService.deleteUserDataFromCourse).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call filesService.markFilesOwnedByUserForDeletion to mark users files to delete in file module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(filesService.markFilesOwnedByUserForDeletion).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call filesService.removeUserPermissionsToAnyFiles to remove users permissions to any files in file module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(filesService.removeUserPermissionsToAnyFiles).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call lessonService.deleteUserDataFromLessons to delete users data in lesson module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(lessonService.deleteUserDataFromLessons).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call pseudonymService.deleteByUserId to delete users data in pseudonym module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(pseudonymService.deleteByUserId).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call teamService.deleteUserDataFromTeams to delete users data in teams module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(teamService.deleteUserDataFromTeams).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call userService.deleteUsers to delete user in user module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(userService.deleteUser).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call rocketChatUserService.findByUserId to find rocketChatUser in rocketChatUser module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(rocketChatUserService.findByUserId).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call rocketChatUserService.deleteByUserId to delete rocketChatUser in rocketChatUser module', async () => {
				const { deletionRequestToExecute, rocketChatUser } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);
				rocketChatUserService.findByUserId.mockResolvedValueOnce(rocketChatUser);

				await uc.executeDeletionRequests();

				expect(rocketChatUserService.deleteByUserId).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call rocketChatService.deleteUser to delete rocketChatUser in rocketChat external module', async () => {
				const { deletionRequestToExecute, rocketChatUser } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);
				rocketChatUserService.findByUserId.mockResolvedValueOnce(rocketChatUser);

				await uc.executeDeletionRequests();

				expect(rocketChatService.deleteUser).toHaveBeenCalledWith(rocketChatUser.username);
			});

			it('should call deletionLogService.createDeletionLog to create logs for deletionRequest', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(deletionLogService.createDeletionLog).toHaveBeenCalledTimes(9);
			});
		});

		describe('when an error occurred', () => {
			const setup = () => {
				jest.clearAllMocks();
				const deletionRequestToExecute = deletionRequestFactory.build({ deleteAfter: new Date('2023-01-01') });

				classService.deleteUserDataFromClasses.mockResolvedValueOnce(1);
				courseGroupService.deleteUserDataFromCourseGroup.mockResolvedValueOnce(2);
				courseService.deleteUserDataFromCourse.mockResolvedValueOnce(2);
				filesService.markFilesOwnedByUserForDeletion.mockResolvedValueOnce(2);
				filesService.removeUserPermissionsToAnyFiles.mockResolvedValueOnce(2);
				lessonService.deleteUserDataFromLessons.mockResolvedValueOnce(2);
				pseudonymService.deleteByUserId.mockResolvedValueOnce(2);
				teamService.deleteUserDataFromTeams.mockResolvedValueOnce(2);
				userService.deleteUser.mockRejectedValueOnce(new Error());

				return {
					deletionRequestToExecute,
				};
			};

			it('should throw an arror', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(deletionRequestService.markDeletionRequestAsFailed).toHaveBeenCalledWith(deletionRequestToExecute.id);
			});
		});
	});

	describe('findById', () => {
		describe('when searching for logs for deletionRequest which was executed', () => {
			const setup = () => {
				jest.clearAllMocks();
				const deletionRequestExecuted = deletionRequestFactory.build({ status: DeletionStatusModel.SUCCESS });
				const deletionLogExecuted1 = deletionLogFactory.build({ deletionRequestId: deletionRequestExecuted.id });
				const deletionLogExecuted2 = deletionLogFactory.build({
					deletionRequestId: deletionRequestExecuted.id,
					domain: DeletionDomainModel.ACCOUNT,
					modifiedCount: 0,
					deletedCount: 1,
				});

				const executedDeletionRequestSummary: DeletionRequestLogResponse = {
					targetRef: {
						domain: deletionRequestExecuted.targetRefDomain,
						id: deletionRequestExecuted.targetRefId,
					},
					deletionPlannedAt: deletionRequestExecuted.deleteAfter,
					statistics: [
						{
							domain: deletionLogExecuted1.domain,
							modifiedCount: deletionLogExecuted1.modifiedCount,
							deletedCount: deletionLogExecuted1.deletedCount,
						},
						{
							domain: deletionLogExecuted2.domain,
							modifiedCount: deletionLogExecuted2.modifiedCount,
							deletedCount: deletionLogExecuted2.deletedCount,
						},
					],
				};

				return {
					deletionRequestExecuted,
					executedDeletionRequestSummary,
					deletionLogExecuted1,
					deletionLogExecuted2,
				};
			};

			it('should call to deletionRequestService and deletionLogService', async () => {
				const { deletionRequestExecuted } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequestExecuted);

				await uc.findById(deletionRequestExecuted.id);

				expect(deletionRequestService.findById).toHaveBeenCalledWith(deletionRequestExecuted.id);
				expect(deletionLogService.findByDeletionRequestId).toHaveBeenCalledWith(deletionRequestExecuted.id);
			});

			it('should return object with summary of deletionRequest', async () => {
				const { deletionRequestExecuted, deletionLogExecuted1, deletionLogExecuted2, executedDeletionRequestSummary } =
					setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequestExecuted);
				deletionLogService.findByDeletionRequestId.mockResolvedValueOnce([deletionLogExecuted1, deletionLogExecuted2]);

				const result = await uc.findById(deletionRequestExecuted.id);

				expect(result).toEqual(executedDeletionRequestSummary);
			});
		});

		describe('when searching for logs for deletionRequest which was not executed', () => {
			const setup = () => {
				jest.clearAllMocks();
				const deletionRequest = deletionRequestFactory.build();
				const notExecutedDeletionRequestSummary: DeletionRequestLogResponse = {
					targetRef: {
						domain: deletionRequest.targetRefDomain,
						id: deletionRequest.targetRefId,
					},
					deletionPlannedAt: deletionRequest.deleteAfter,
				};

				return {
					deletionRequest,
					notExecutedDeletionRequestSummary,
				};
			};

			it('should call to deletionRequestService', async () => {
				const { deletionRequest } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequest);

				await uc.findById(deletionRequest.id);

				expect(deletionRequestService.findById).toHaveBeenCalledWith(deletionRequest.id);
				expect(deletionLogService.findByDeletionRequestId).not.toHaveBeenCalled();
			});

			it('should return object with summary of deletionRequest', async () => {
				const { deletionRequest, notExecutedDeletionRequestSummary } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequest);

				const result = await uc.findById(deletionRequest.id);

				expect(result).toEqual(notExecutedDeletionRequestSummary);
			});
		});
	});

	describe('deleteDeletionRequestById', () => {
		describe('when deleting a deletionRequestId', () => {
			const setup = () => {
				jest.clearAllMocks();
				const deletionRequest = deletionRequestFactory.build();

				return {
					deletionRequest,
				};
			};

			it('should call the service deletionRequestService.deleteById', async () => {
				const { deletionRequest } = setup();

				await uc.deleteDeletionRequestById(deletionRequest.id);

				expect(deletionRequestService.deleteById).toHaveBeenCalledWith(deletionRequest.id);
			});
		});
	});
});
