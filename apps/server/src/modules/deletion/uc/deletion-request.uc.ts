import { AccountService } from '@modules/account/services';
import { ClassService } from '@modules/class';
import { FilesService } from '@modules/files/service';
import { CourseGroupService, CourseService, DashboardService } from '@modules/learnroom';
import { LessonService } from '@modules/lesson/service';
import { PseudonymService } from '@modules/pseudonym';
import { RegistrationPinService } from '@modules/registration-pin';
import { RocketChatService } from '@modules/rocketchat';
import { RocketChatUserService } from '@modules/rocketchat-user';
import { TeamService } from '@modules/teams';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { DomainModel, EntityId, OperationModel } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { TaskService } from '@modules/task';
import { DomainOperation } from '@shared/domain/interface';
import { DomainOperationBuilder } from '@shared/domain/builder/domain-operation.builder';
import { DeletionRequestLogResponseBuilder, DeletionTargetRefBuilder } from '../builder';
import { DeletionRequestBodyProps, DeletionRequestLogResponse, DeletionRequestResponse } from '../controller/dto';
import { DeletionRequest, DeletionLog } from '../domain';
import { DeletionRequestService, DeletionLogService } from '../services';

@Injectable()
export class DeletionRequestUc {
	constructor(
		private readonly deletionRequestService: DeletionRequestService,
		private readonly deletionLogService: DeletionLogService,
		private readonly accountService: AccountService,
		private readonly classService: ClassService,
		private readonly courseGroupService: CourseGroupService,
		private readonly courseService: CourseService,
		private readonly filesService: FilesService,
		private readonly lessonService: LessonService,
		private readonly pseudonymService: PseudonymService,
		private readonly teamService: TeamService,
		private readonly userService: UserService,
		private readonly rocketChatUserService: RocketChatUserService,
		private readonly rocketChatService: RocketChatService,
		private readonly logger: LegacyLogger,
		private readonly registrationPinService: RegistrationPinService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly dashboardService: DashboardService,
		private readonly taskService: TaskService
	) {
		this.logger.setContext(DeletionRequestUc.name);
	}

	async createDeletionRequest(deletionRequest: DeletionRequestBodyProps): Promise<DeletionRequestResponse> {
		this.logger.debug({ action: 'createDeletionRequest', deletionRequest });
		const result = await this.deletionRequestService.createDeletionRequest(
			deletionRequest.targetRef.id,
			deletionRequest.targetRef.domain,
			deletionRequest.deleteInMinutes
		);

		return result;
	}

	async executeDeletionRequests(limit?: number): Promise<void> {
		this.logger.debug({ action: 'executeDeletionRequests', limit });

		const deletionRequestToExecution: DeletionRequest[] = await this.deletionRequestService.findAllItemsToExecute(
			limit
		);

		for (const req of deletionRequestToExecution) {
			// eslint-disable-next-line no-await-in-loop
			await this.executeDeletionRequest(req);
		}
	}

	async findById(deletionRequestId: EntityId): Promise<DeletionRequestLogResponse> {
		this.logger.debug({ action: 'deletionRequestId', deletionRequestId });

		const deletionRequest: DeletionRequest = await this.deletionRequestService.findById(deletionRequestId);
		let response: DeletionRequestLogResponse = DeletionRequestLogResponseBuilder.build(
			DeletionTargetRefBuilder.build(deletionRequest.targetRefDomain, deletionRequest.targetRefId),
			deletionRequest.deleteAfter,
			deletionRequest.status
		);

		const deletionLog: DeletionLog[] = await this.deletionLogService.findByDeletionRequestId(deletionRequestId);
		const domainOperation: DomainOperation[] = deletionLog.map((log) =>
			DomainOperationBuilder.build(log.domain, log.operation, log.count, log.refs)
		);
		response = { ...response, statistics: domainOperation };

		return response;
	}

	async deleteDeletionRequestById(deletionRequestId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteDeletionRequestById', deletionRequestId });

		await this.deletionRequestService.deleteById(deletionRequestId);
	}

	private async executeDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		try {
			await Promise.all([
				this.removeAccount(deletionRequest),
				this.removeUserFromClasses(deletionRequest),
				this.removeUserFromCourseGroup(deletionRequest),
				this.removeUserFromCourse(deletionRequest),
				this.removeUsersFilesAndPermissions(deletionRequest),
				this.removeUsersDataFromFileRecords(deletionRequest),
				this.removeUserFromLessons(deletionRequest),
				this.removeUsersPseudonyms(deletionRequest),
				this.removeUserFromTeams(deletionRequest),
				this.removeUser(deletionRequest),
				this.removeUserFromRocketChat(deletionRequest),
				this.removeUserRegistrationPin(deletionRequest),
				this.removeUsersDashboard(deletionRequest),
				this.removeUserFromTasks(deletionRequest),
			]);
			await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequest.id);
		} catch (error) {
			this.logger.error(`execution of deletionRequest ${deletionRequest.id} was failed`, error);
			await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);
		}
	}

	private async logDeletion(
		deletionRequest: DeletionRequest,
		domainModel: DomainModel,
		operation: OperationModel,
		count: number,
		refs: string[]
	): Promise<void> {
		await this.deletionLogService.createDeletionLog(deletionRequest.id, domainModel, operation, count, refs);
	}

	private async removeAccount(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeAccount', deletionRequest });

		await this.accountService.deleteByUserId(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.ACCOUNT, OperationModel.DELETE, 1, []);
	}

	private async removeUserRegistrationPin(deletionRequest: DeletionRequest) {
		const userToDeletion = await this.userService.findById(deletionRequest.targetRefId);
		const parentEmails = await this.userService.getParentEmailsFromUser(deletionRequest.targetRefId);
		const emailsToDeletion: string[] = [userToDeletion.email, ...parentEmails];

		const result = await Promise.all(
			emailsToDeletion.map((email) => this.registrationPinService.deleteRegistrationPinByEmail(email))
		);
		const deletedRegistrationPin = result.filter((res) => res !== 0).length;

		await this.logDeletion(
			deletionRequest,
			DomainModel.REGISTRATIONPIN,
			OperationModel.DELETE,
			deletedRegistrationPin,
			[]
		);
	}

	private async removeUserFromClasses(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromClasses', deletionRequest });

		const classesUpdated = await this.classService.deleteUserDataFromClasses(deletionRequest.targetRefId);
		await this.logDeletion(
			deletionRequest,
			classesUpdated.domain,
			classesUpdated.operation,
			classesUpdated.count,
			classesUpdated.refs
		);
	}

	private async removeUserFromCourseGroup(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromCourseGroup', deletionRequest });

		const courseGroupUpdated = await this.courseGroupService.deleteUserDataFromCourseGroup(deletionRequest.targetRefId);
		await this.logDeletion(
			deletionRequest,
			courseGroupUpdated.domain,
			courseGroupUpdated.operation,
			courseGroupUpdated.count,
			courseGroupUpdated.refs
		);
	}

	private async removeUserFromCourse(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromCourse', deletionRequest });

		const courseUpdated = await this.courseService.deleteUserDataFromCourse(deletionRequest.targetRefId);
		await this.logDeletion(
			deletionRequest,
			courseUpdated.domain,
			courseUpdated.operation,
			courseUpdated.count,
			courseUpdated.refs
		);
	}

	private async removeUsersDashboard(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersDashboard', deletionRequest });

		const dashboardDeleted: number = await this.dashboardService.deleteDashboardByUserId(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.DASHBOARD, OperationModel.DELETE, dashboardDeleted, []);
	}

	private async removeUsersFilesAndPermissions(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersFilesAndPermissions', deletionRequest });

		const filesDeleted: number = await this.filesService.markFilesOwnedByUserForDeletion(deletionRequest.targetRefId);
		const filesUpdated: number = await this.filesService.removeUserPermissionsOrCreatorReferenceToAnyFiles(
			deletionRequest.targetRefId
		);
		await this.logDeletion(deletionRequest, DomainModel.FILE, OperationModel.UPDATE, filesDeleted + filesUpdated, []);
	}

	private async removeUsersDataFromFileRecords(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersDataFromFileRecords', deletionRequest });

		const fileRecordsUpdated = await this.filesStorageClientAdapterService.removeCreatorIdFromFileRecords(
			deletionRequest.targetRefId
		);

		await this.logDeletion(deletionRequest, DomainModel.FILERECORDS, OperationModel.UPDATE, fileRecordsUpdated, []);
	}

	private async removeUserFromLessons(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromLessons', deletionRequest });

		const lessonsUpdated = await this.lessonService.deleteUserDataFromLessons(deletionRequest.targetRefId);
		await this.logDeletion(
			deletionRequest,
			lessonsUpdated.domain,
			lessonsUpdated.operation,
			lessonsUpdated.count,
			lessonsUpdated.refs
		);
	}

	private async removeUsersPseudonyms(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersPseudonyms', deletionRequest });

		const pseudonymDeleted: number = await this.pseudonymService.deleteByUserId(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.PSEUDONYMS, OperationModel.DELETE, pseudonymDeleted, []);
	}

	private async removeUserFromTeams(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: ' removeUserFromTeams', deletionRequest });

		const teamsUpdated = await this.teamService.deleteUserDataFromTeams(deletionRequest.targetRefId);
		await this.logDeletion(
			deletionRequest,
			teamsUpdated.domain,
			teamsUpdated.operation,
			teamsUpdated.count,
			teamsUpdated.refs
		);
	}

	private async removeUser(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUser', deletionRequest });

		const userDeleted: number = await this.userService.deleteUser(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.USER, OperationModel.DELETE, userDeleted, []);
	}

	private async removeUserFromRocketChat(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromRocketChat', deletionRequest });

		const rocketChatUser = await this.rocketChatUserService.findByUserId(deletionRequest.targetRefId);

		const [rocketChatDeleted, rocketChatUserDeleted] = await Promise.all([
			this.rocketChatService.deleteUser(rocketChatUser.username),
			this.rocketChatUserService.deleteByUserId(rocketChatUser.userId),
		]);

		await this.logDeletion(
			deletionRequest,
			rocketChatUserDeleted.domain,
			rocketChatUserDeleted.operation,
			rocketChatUserDeleted.count,
			rocketChatUserDeleted.refs
		);

		if (rocketChatDeleted) {
			await this.logDeletion(deletionRequest, DomainModel.ROCKETCHATSERVICE, OperationModel.DELETE, 1, [
				rocketChatUser.username,
			]);
		}
	}

	private async removeUserFromTasks(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromTasks', deletionRequest });

		const tasksDeleted = await this.taskService.deleteTasksByOnlyCreator(deletionRequest.targetRefId);
		const tasksModifiedByRemoveCreator = await this.taskService.removeCreatorIdFromTasks(deletionRequest.targetRefId);
		const tasksModifiedByRemoveUserFromFinished = await this.taskService.removeUserFromFinished(
			deletionRequest.targetRefId
		);

		await this.logDeletion(
			deletionRequest,
			tasksDeleted.domain,
			tasksDeleted.operation,
			tasksDeleted.count,
			tasksDeleted.refs
		);

		await this.logDeletion(
			deletionRequest,
			tasksModifiedByRemoveCreator.domain,
			tasksModifiedByRemoveCreator.operation,
			tasksModifiedByRemoveCreator.count + tasksModifiedByRemoveUserFromFinished.count,
			[]
		);
	}
}
