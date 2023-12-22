import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { setupEntities, userDoFactory } from '@shared/testing';
import { AccountService } from '@modules/account';
import { ClassService } from '@modules/class';
import { CourseGroupService, CourseService, DashboardService } from '@modules/learnroom';
import { FilesService } from '@modules/files';
import { LessonService } from '@modules/lesson';
import { PseudonymService } from '@modules/pseudonym';
import { TeamService } from '@modules/teams';
import { UserService } from '@modules/user';
import { RocketChatService } from '@modules/rocketchat';
import { RocketChatUser, RocketChatUserService, rocketChatUserFactory } from '@modules/rocketchat-user';
import { LegacyLogger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { RegistrationPinService } from '@modules/registration-pin';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { DeletionDomainModel, DeletionStatusModel } from '../domain/types';
import { DeletionLogService } from '../services/deletion-log.service';
import { DeletionRequestService } from '../services';
import { DeletionRequestUc } from './deletion-request.uc';
import { deletionRequestFactory } from '../domain/testing/factory/deletion-request.factory';
import { deletionLogFactory } from '../domain/testing';
import { DeletionRequestBodyProps } from '../controller/dto';
import { DeletionRequestLogResponseBuilder, DeletionTargetRefBuilder, DeletionLogStatisticBuilder } from '../builder';

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
	let registrationPinService: DeepMocked<RegistrationPinService>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let dashboardService: DeepMocked<DashboardService>;

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
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: RegistrationPinService,
					useValue: createMock<RegistrationPinService>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: DashboardService,
					useValue: createMock<DashboardService>(),
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
		registrationPinService = module.get(RegistrationPinService);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		dashboardService = module.get(DashboardService);
		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('createDeletionRequest', () => {
		describe('when creating a deletionRequest', () => {
			const setup = () => {
				const deletionRequestToCreate: DeletionRequestBodyProps = {
					targetRef: {
						domain: DeletionDomainModel.USER,
						id: new ObjectId().toHexString(),
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
				const deletionRequestToExecute = deletionRequestFactory.build({ deleteAfter: new Date('2023-01-01') });
				const user = userDoFactory.buildWithId();
				const rocketChatUser: RocketChatUser = rocketChatUserFactory.build({
					userId: deletionRequestToExecute.targetRefId,
				});
				const parentEmail = 'parent@parent.eu';

				registrationPinService.deleteRegistrationPinByEmail.mockResolvedValueOnce(2);
				classService.deleteUserDataFromClasses.mockResolvedValueOnce(1);
				courseGroupService.deleteUserDataFromCourseGroup.mockResolvedValueOnce(2);
				courseService.deleteUserDataFromCourse.mockResolvedValueOnce(2);
				filesService.markFilesOwnedByUserForDeletion.mockResolvedValueOnce(2);
				filesService.removeUserPermissionsOrCreatorReferenceToAnyFiles.mockResolvedValueOnce(2);
				lessonService.deleteUserDataFromLessons.mockResolvedValueOnce(2);
				pseudonymService.deleteByUserId.mockResolvedValueOnce(2);
				teamService.deleteUserDataFromTeams.mockResolvedValueOnce(2);
				userService.deleteUser.mockResolvedValueOnce(1);
				rocketChatUserService.deleteByUserId.mockResolvedValueOnce(1);
				filesStorageClientAdapterService.removeCreatorIdFromFileRecords.mockResolvedValueOnce(5);
				dashboardService.deleteDashboardByUserId.mockResolvedValueOnce(1);

				return {
					deletionRequestToExecute,
					rocketChatUser,
					user,
					parentEmail,
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

			it('should call registrationPinService.deleteRegistrationPinByEmail to delete user data in registrationPin module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(registrationPinService.deleteRegistrationPinByEmail).toHaveBeenCalled();
			});

			it('should call userService.getParentEmailsFromUser to get parentEmails', async () => {
				const { deletionRequestToExecute, user, parentEmail } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);
				userService.findById.mockResolvedValueOnce(user);
				userService.getParentEmailsFromUser.mockRejectedValue([parentEmail]);
				registrationPinService.deleteRegistrationPinByEmail.mockRejectedValueOnce(2);

				await uc.executeDeletionRequests();

				expect(userService.getParentEmailsFromUser).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
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

				expect(filesService.removeUserPermissionsOrCreatorReferenceToAnyFiles).toHaveBeenCalledWith(
					deletionRequestToExecute.targetRefId
				);
			});

			it('should call filesStorageClientAdapterService.removeCreatorIdFromFileRecords to remove cratorId to any files in fileRecords module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(filesStorageClientAdapterService.removeCreatorIdFromFileRecords).toHaveBeenCalledWith(
					deletionRequestToExecute.targetRefId
				);
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

			it('should call dashboardService.deleteDashboardByUserId to delete USERS DASHBOARD', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(dashboardService.deleteDashboardByUserId).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call deletionLogService.createDeletionLog to create logs for deletionRequest', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(deletionLogService.createDeletionLog).toHaveBeenCalledTimes(12);
			});
		});

		describe('when an error occurred', () => {
			const setup = () => {
				const deletionRequestToExecute = deletionRequestFactory.build({ deleteAfter: new Date('2023-01-01') });

				classService.deleteUserDataFromClasses.mockResolvedValueOnce(1);
				courseGroupService.deleteUserDataFromCourseGroup.mockResolvedValueOnce(2);
				courseService.deleteUserDataFromCourse.mockResolvedValueOnce(2);
				filesService.markFilesOwnedByUserForDeletion.mockResolvedValueOnce(2);
				filesService.removeUserPermissionsOrCreatorReferenceToAnyFiles.mockResolvedValueOnce(2);
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
				const deletionRequestExecuted = deletionRequestFactory.build({ status: DeletionStatusModel.SUCCESS });
				const deletionLogExecuted = deletionLogFactory.build({ deletionRequestId: deletionRequestExecuted.id });

				const targetRef = DeletionTargetRefBuilder.build(
					deletionRequestExecuted.targetRefDomain,
					deletionRequestExecuted.targetRefId
				);
				const statistics = DeletionLogStatisticBuilder.build(
					deletionLogExecuted.domain,
					deletionLogExecuted.modifiedCount,
					deletionLogExecuted.deletedCount
				);

				const executedDeletionRequestSummary = DeletionRequestLogResponseBuilder.build(
					targetRef,
					deletionRequestExecuted.deleteAfter,
					[statistics]
				);

				return {
					deletionRequestExecuted,
					executedDeletionRequestSummary,
					deletionLogExecuted,
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
				const { deletionRequestExecuted, deletionLogExecuted, executedDeletionRequestSummary } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequestExecuted);
				deletionLogService.findByDeletionRequestId.mockResolvedValueOnce([deletionLogExecuted]);

				const result = await uc.findById(deletionRequestExecuted.id);

				expect(result).toEqual(executedDeletionRequestSummary);
			});
		});

		describe('when searching for logs for deletionRequest which was not executed', () => {
			const setup = () => {
				const deletionRequest = deletionRequestFactory.build();
				const targetRef = DeletionTargetRefBuilder.build(deletionRequest.targetRefDomain, deletionRequest.targetRefId);
				const notExecutedDeletionRequestSummary = DeletionRequestLogResponseBuilder.build(
					targetRef,
					deletionRequest.deleteAfter
				);

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
