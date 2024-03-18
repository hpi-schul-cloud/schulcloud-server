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
import { ObjectId } from '@mikro-orm/mongodb';
import { RegistrationPinService } from '@modules/registration-pin';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { DomainName, OperationType } from '@shared/domain/types';
import { SubmissionService, TaskService } from '@modules/task';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { NewsService } from '@src/modules/news/service/news.service';
import { DeletionStatusModel } from '../domain/types';
import { DeletionLogService } from '../services/deletion-log.service';
import { DeletionRequestService } from '../services';
import { DeletionRequestUc } from './deletion-request.uc';
import { deletionRequestFactory } from '../domain/testing/factory/deletion-request.factory';
import { deletionLogFactory } from '../domain/testing';
import { DeletionRequestBodyProps } from '../controller/dto';
import { DeletionLogStatisticBuilder, DeletionRequestLogResponseBuilder, DeletionTargetRefBuilder } from '../builder';

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
	let taskService: DeepMocked<TaskService>;
	let newsService: DeepMocked<NewsService>;
	let submissionService: DeepMocked<SubmissionService>;

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
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{ provide: NewsService, useValue: createMock<NewsService>() },
				{ provide: SubmissionService, useValue: createMock<SubmissionService>() },
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
		taskService = module.get(TaskService);
		newsService = module.get(NewsService);
		submissionService = module.get(SubmissionService);
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
						domain: DomainName.USER,
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
				const accountDeleted = DomainOperationBuilder.build(DomainName.ACCOUNT, OperationType.DELETE, 1, [
					new ObjectId().toHexString(),
				]);

				const classesUpdated = DomainOperationBuilder.build(DomainName.CLASS, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const courseGroupUpdated = DomainOperationBuilder.build(DomainName.COURSEGROUP, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const courseUpdated = DomainOperationBuilder.build(DomainName.COURSE, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const deletionRequestToExecute = deletionRequestFactory.build({ deleteAfter: new Date('2023-01-01') });

				const dashboardDeleted = DomainOperationBuilder.build(DomainName.DASHBOARD, OperationType.DELETE, 1, [
					new ObjectId().toHexString(),
				]);

				const filesDeleted = DomainOperationBuilder.build(DomainName.FILE, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const filesUpdated = DomainOperationBuilder.build(DomainName.FILE, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const fileRecordsUpdated = DomainOperationBuilder.build(DomainName.FILERECORDS, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const lessonsUpdated = DomainOperationBuilder.build(DomainName.LESSONS, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const newsUpdated = DomainOperationBuilder.build(DomainName.LESSONS, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const parentEmail = 'parent@parent.eu';

				const pseudonymsDeleted = DomainOperationBuilder.build(DomainName.PSEUDONYMS, OperationType.DELETE, 1, [
					new ObjectId().toHexString(),
				]);

				const registrationPinDeleted = DomainOperationBuilder.build(
					DomainName.REGISTRATIONPIN,
					OperationType.DELETE,
					1,
					[new ObjectId().toHexString()]
				);

				const rocketChatUser: RocketChatUser = rocketChatUserFactory.build({
					userId: deletionRequestToExecute.targetRefId,
				});

				const rocketChatUserDeleted = DomainOperationBuilder.build(DomainName.ROCKETCHATUSER, OperationType.DELETE, 1, [
					new ObjectId().toHexString(),
				]);

				const rocketChatServiceDeleted = { success: true };

				const tasksModifiedByRemoveCreatorId = DomainOperationBuilder.build(DomainName.TASK, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const tasksModifiedByRemoveUserFromFinished = DomainOperationBuilder.build(
					DomainName.TASK,
					OperationType.UPDATE,
					1,
					[new ObjectId().toHexString()]
				);

				const tasksDeleted = DomainOperationBuilder.build(DomainName.TASK, OperationType.DELETE, 1, [
					new ObjectId().toHexString(),
				]);

				const teamsUpdated = DomainOperationBuilder.build(DomainName.TEAMS, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const userDeleted = DomainOperationBuilder.build(DomainName.USER, OperationType.DELETE, 1, [
					new ObjectId().toHexString(),
				]);

				const submissionsDeleted = DomainOperationBuilder.build(DomainName.SUBMISSIONS, OperationType.DELETE, 1, [
					new ObjectId().toHexString(),
				]);
				const submissionsUpdated = DomainOperationBuilder.build(DomainName.SUBMISSIONS, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const user = userDoFactory.buildWithId();

				accountService.deleteAccountByUserId.mockResolvedValueOnce(accountDeleted);
				registrationPinService.deleteRegistrationPinByEmail.mockResolvedValueOnce(registrationPinDeleted);
				classService.deleteUserDataFromClasses.mockResolvedValueOnce(classesUpdated);
				courseGroupService.deleteUserDataFromCourseGroup.mockResolvedValueOnce(courseGroupUpdated);
				courseService.deleteUserDataFromCourse.mockResolvedValueOnce(courseUpdated);
				filesService.markFilesOwnedByUserForDeletion.mockResolvedValueOnce(filesDeleted);
				filesService.removeUserPermissionsOrCreatorReferenceToAnyFiles.mockResolvedValueOnce(filesUpdated);
				lessonService.deleteUserDataFromLessons.mockResolvedValueOnce(lessonsUpdated);
				pseudonymService.deleteByUserId.mockResolvedValueOnce(pseudonymsDeleted);
				teamService.deleteUserDataFromTeams.mockResolvedValueOnce(teamsUpdated);
				userService.deleteUser.mockResolvedValueOnce(userDeleted);
				rocketChatUserService.deleteByUserId.mockResolvedValueOnce(rocketChatUserDeleted);
				rocketChatService.deleteUser.mockResolvedValueOnce(rocketChatServiceDeleted);
				filesStorageClientAdapterService.removeCreatorIdFromFileRecords.mockResolvedValueOnce(fileRecordsUpdated);
				dashboardService.deleteDashboardByUserId.mockResolvedValueOnce(dashboardDeleted);
				taskService.removeCreatorIdFromTasks.mockResolvedValueOnce(tasksModifiedByRemoveCreatorId);
				taskService.removeUserFromFinished.mockResolvedValueOnce(tasksModifiedByRemoveUserFromFinished);
				taskService.deleteTasksByOnlyCreator.mockResolvedValueOnce(tasksDeleted);
				newsService.deleteCreatorOrUpdaterReference.mockResolvedValueOnce(newsUpdated);
				submissionService.deleteSingleSubmissionsOwnedByUser.mockResolvedValueOnce(submissionsDeleted);
				submissionService.removeUserReferencesFromSubmissions.mockResolvedValueOnce(submissionsUpdated);

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

			it('should call accountService.deleteAccountByUserId to delete user data in account module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(accountService.deleteAccountByUserId).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call registrationPinService.deleteRegistrationPinByEmail to delete user data in registrationPin module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(registrationPinService.deleteRegistrationPinByEmail).toHaveBeenCalled();
			});

			it('should call userService.findById and userService.getParentEmailsFromUser to get own email and parentEmails', async () => {
				const { deletionRequestToExecute, user, parentEmail } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);
				userService.findByIdOrNull.mockResolvedValueOnce(user);
				userService.getParentEmailsFromUser.mockRejectedValue([parentEmail]);
				registrationPinService.deleteRegistrationPinByEmail.mockRejectedValueOnce(3);

				await uc.executeDeletionRequests();

				expect(userService.findByIdOrNull).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
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

			it('should call rocketChatUserService.findByUserId to find rocketChatUser in rocketChatUser module', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(rocketChatUserService.findByUserId).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call rocketChatUserService.deleteByUserId to delete rocketChatUser in rocketChatUser module', async () => {
				const { deletionRequestToExecute, rocketChatUser } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);
				rocketChatUserService.findByUserId.mockResolvedValueOnce([rocketChatUser]);

				await uc.executeDeletionRequests();

				expect(rocketChatUserService.deleteByUserId).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call rocketChatService.deleteUser to delete rocketChatUser in rocketChat external module', async () => {
				const { deletionRequestToExecute, rocketChatUser } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);
				rocketChatUserService.findByUserId.mockResolvedValueOnce([rocketChatUser]);

				await uc.executeDeletionRequests();

				expect(rocketChatService.deleteUser).toHaveBeenCalledWith(rocketChatUser.username);
			});

			it('should call dashboardService.deleteDashboardByUserId to delete USERS DASHBOARD', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(dashboardService.deleteDashboardByUserId).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call taskService.deleteTasksByOnlyCreator to delete Tasks only with creator', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(taskService.deleteTasksByOnlyCreator).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call taskService.removeCreatorIdFromTasks to update Tasks without creatorId', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(taskService.removeCreatorIdFromTasks).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call taskService.removeUserFromFinished to update Tasks without creatorId in Finished collection', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(taskService.removeUserFromFinished).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call newsService.deleteCreatorOrUpdaterReference to update News without creatorId', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(newsService.deleteCreatorOrUpdaterReference).toHaveBeenCalledWith(deletionRequestToExecute.targetRefId);
			});

			it('should call submissionService.deleteSubmissionsByUserId to delete submissions', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(submissionService.deleteSingleSubmissionsOwnedByUser).toHaveBeenCalledWith(
					deletionRequestToExecute.targetRefId
				);
			});

			it('should call submissionService.updateSubmissionByUserId to update submissions', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(submissionService.removeUserReferencesFromSubmissions).toHaveBeenCalledWith(
					deletionRequestToExecute.targetRefId
				);
			});

			it('should call deletionLogService.createDeletionLog to create logs for deletionRequest', async () => {
				const { deletionRequestToExecute } = setup();

				deletionRequestService.findAllItemsToExecute.mockResolvedValueOnce([deletionRequestToExecute]);

				await uc.executeDeletionRequests();

				expect(deletionLogService.createDeletionLog).toHaveBeenCalledTimes(15);
			});
		});

		describe('when an error occurred', () => {
			const setup = () => {
				const deletionRequestToExecute = deletionRequestFactory.build({ deleteAfter: new Date('2023-01-01') });

				const classesUpdated = DomainOperationBuilder.build(DomainName.CLASS, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const courseGroupUpdated = DomainOperationBuilder.build(DomainName.COURSEGROUP, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const courseUpdated = DomainOperationBuilder.build(DomainName.COURSE, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const filesDeleted = DomainOperationBuilder.build(DomainName.FILE, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const filesUpdated = DomainOperationBuilder.build(DomainName.FILE, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const lessonsUpdated = DomainOperationBuilder.build(DomainName.LESSONS, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				const pseudonymsDeleted = DomainOperationBuilder.build(DomainName.PSEUDONYMS, OperationType.DELETE, 1, [
					new ObjectId().toHexString(),
				]);

				const teamsUpdated = DomainOperationBuilder.build(DomainName.TEAMS, OperationType.UPDATE, 1, [
					new ObjectId().toHexString(),
				]);

				classService.deleteUserDataFromClasses.mockResolvedValueOnce(classesUpdated);
				courseGroupService.deleteUserDataFromCourseGroup.mockResolvedValueOnce(courseGroupUpdated);
				courseService.deleteUserDataFromCourse.mockResolvedValueOnce(courseUpdated);
				filesService.markFilesOwnedByUserForDeletion.mockResolvedValueOnce(filesDeleted);
				filesService.removeUserPermissionsOrCreatorReferenceToAnyFiles.mockResolvedValueOnce(filesUpdated);
				lessonService.deleteUserDataFromLessons.mockResolvedValueOnce(lessonsUpdated);
				pseudonymService.deleteByUserId.mockResolvedValueOnce(pseudonymsDeleted);
				teamService.deleteUserDataFromTeams.mockResolvedValueOnce(teamsUpdated);
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
		describe('when searching for logs for deletionRequest which was executed with success status', () => {
			const setup = () => {
				const deletionRequestExecuted = deletionRequestFactory.build({ status: DeletionStatusModel.SUCCESS });
				const deletionLogExecuted = deletionLogFactory.build({ deletionRequestId: deletionRequestExecuted.id });

				const targetRef = DeletionTargetRefBuilder.build(
					deletionRequestExecuted.targetRefDomain,
					deletionRequestExecuted.targetRefId
				);
				const statistics = DomainOperationBuilder.build(
					deletionLogExecuted.domain,
					deletionLogExecuted.operation,
					deletionLogExecuted.count,
					deletionLogExecuted.refs
				);

				const executedDeletionRequestSummary = DeletionRequestLogResponseBuilder.build(
					targetRef,
					deletionRequestExecuted.deleteAfter,
					DeletionStatusModel.SUCCESS,
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
				expect(result.status).toEqual(DeletionStatusModel.SUCCESS);
			});
		});

		describe('when searching for logs for deletionRequest which was executed with failed status', () => {
			const setup = () => {
				const deletionRequestExecuted = deletionRequestFactory.build({ status: DeletionStatusModel.FAILED });
				const deletionLogExecuted = deletionLogFactory.build({ deletionRequestId: deletionRequestExecuted.id });

				const targetRef = DeletionTargetRefBuilder.build(
					deletionRequestExecuted.targetRefDomain,
					deletionRequestExecuted.targetRefId
				);
				const statistics = DeletionLogStatisticBuilder.build(
					deletionLogExecuted.domain,
					deletionLogExecuted.operation,
					deletionLogExecuted.count,
					deletionLogExecuted.refs
				);

				const executedDeletionRequestSummary = DeletionRequestLogResponseBuilder.build(
					targetRef,
					deletionRequestExecuted.deleteAfter,
					DeletionStatusModel.FAILED,
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
				expect(result.status).toEqual(DeletionStatusModel.FAILED);
			});
		});

		describe('when searching for logs for deletionRequest which was not executed', () => {
			const setup = () => {
				const deletionRequest = deletionRequestFactory.build();
				const targetRef = DeletionTargetRefBuilder.build(deletionRequest.targetRefDomain, deletionRequest.targetRefId);
				const notExecutedDeletionRequestSummary = DeletionRequestLogResponseBuilder.build(
					targetRef,
					deletionRequest.deleteAfter,
					DeletionStatusModel.REGISTERED,
					[]
				);

				return {
					deletionRequest,
					notExecutedDeletionRequestSummary,
				};
			};

			it('should call to deletionRequestService and deletionLogService', async () => {
				const { deletionRequest } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequest);

				await uc.findById(deletionRequest.id);

				expect(deletionRequestService.findById).toHaveBeenCalledWith(deletionRequest.id);
				expect(deletionLogService.findByDeletionRequestId).toHaveBeenCalledWith(deletionRequest.id);
			});

			it('should return object with summary of deletionRequest', async () => {
				const { deletionRequest, notExecutedDeletionRequestSummary } = setup();

				deletionRequestService.findById.mockResolvedValueOnce(deletionRequest);

				const result = await uc.findById(deletionRequest.id);

				expect(result).toEqual(notExecutedDeletionRequestSummary);
				expect(result.status).toEqual(DeletionStatusModel.REGISTERED);
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
