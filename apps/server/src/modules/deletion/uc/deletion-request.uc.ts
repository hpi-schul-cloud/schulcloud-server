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
import { DomainModel, EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { DeletionLogStatisticBuilder, DeletionRequestLogResponseBuilder, DeletionTargetRefBuilder } from '../builder';
import { DeletionRequestBodyProps, DeletionRequestLogResponse, DeletionRequestResponse } from '../controller/dto';
import { DeletionLogStatistic } from './interface/interfaces';
import { DeletionRequest, DeletionLog } from '../domain';
import { DeletionOperationModel, DeletionStatusModel } from '../domain/types';
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
		private readonly dashboardService: DashboardService
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
			deletionRequest.deleteAfter
		);

		if (deletionRequest.status === DeletionStatusModel.SUCCESS) {
			const deletionLog: DeletionLog[] = await this.deletionLogService.findByDeletionRequestId(deletionRequestId);
			const deletionLogStatistic: DeletionLogStatistic[] = deletionLog.map((log) =>
				DeletionLogStatisticBuilder.build(log.domain, log.modifiedCount, log.deletedCount)
			);
			response = { ...response, statistics: deletionLogStatistic };
		}

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
		operationModel: DeletionOperationModel,
		updatedCount: number,
		deletedCount: number
	): Promise<void> {
		if (updatedCount > 0 || deletedCount > 0) {
			await this.deletionLogService.createDeletionLog(
				deletionRequest.id,
				domainModel,
				operationModel,
				updatedCount,
				deletedCount
			);
		}
	}

	private async removeAccount(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeAccount', deletionRequest });

		await this.accountService.deleteByUserId(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.ACCOUNT, DeletionOperationModel.DELETE, 0, 1);
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
			DeletionOperationModel.DELETE,
			0,
			deletedRegistrationPin
		);
	}

	private async removeUserFromClasses(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromClasses', deletionRequest });

		const classesUpdated: number = await this.classService.deleteUserDataFromClasses(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.CLASS, DeletionOperationModel.UPDATE, classesUpdated, 0);
	}

	private async removeUserFromCourseGroup(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromCourseGroup', deletionRequest });

		const courseGroupUpdated: number = await this.courseGroupService.deleteUserDataFromCourseGroup(
			deletionRequest.targetRefId
		);
		await this.logDeletion(
			deletionRequest,
			DomainModel.COURSEGROUP,
			DeletionOperationModel.UPDATE,
			courseGroupUpdated,
			0
		);
	}

	private async removeUserFromCourse(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromCourse', deletionRequest });

		const courseUpdated: number = await this.courseService.deleteUserDataFromCourse(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.COURSE, DeletionOperationModel.UPDATE, courseUpdated, 0);
	}

	private async removeUsersDashboard(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersDashboard', deletionRequest });

		const dashboardDeleted: number = await this.dashboardService.deleteDashboardByUserId(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.DASHBOARD, DeletionOperationModel.DELETE, 0, dashboardDeleted);
	}

	private async removeUsersFilesAndPermissions(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersFilesAndPermissions', deletionRequest });

		const filesDeleted: number = await this.filesService.markFilesOwnedByUserForDeletion(deletionRequest.targetRefId);
		const filePermissionsUpdated: number = await this.filesService.removeUserPermissionsToAnyFiles(
			deletionRequest.targetRefId
		);
		await this.logDeletion(
			deletionRequest,
			DomainModel.FILE,
			DeletionOperationModel.UPDATE,
			filesDeleted + filePermissionsUpdated,
			0
		);
	}

	private async removeUsersDataFromFileRecords(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersDataFromFileRecords', deletionRequest });

		const fileRecordsUpdated = await this.filesStorageClientAdapterService.removeCreatorIdFromFileRecords(
			deletionRequest.targetRefId
		);

		await this.logDeletion(
			deletionRequest,
			DomainModel.FILERECORDS,
			DeletionOperationModel.UPDATE,
			fileRecordsUpdated,
			0
		);
	}

	private async removeUserFromLessons(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromLessons', deletionRequest });

		const lessonsUpdated: number = await this.lessonService.deleteUserDataFromLessons(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.LESSONS, DeletionOperationModel.UPDATE, lessonsUpdated, 0);
	}

	private async removeUsersPseudonyms(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersPseudonyms', deletionRequest });

		const pseudonymDeleted: number = await this.pseudonymService.deleteByUserId(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.PSEUDONYMS, DeletionOperationModel.DELETE, 0, pseudonymDeleted);
	}

	private async removeUserFromTeams(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: ' removeUserFromTeams', deletionRequest });

		const teamsUpdated: number = await this.teamService.deleteUserDataFromTeams(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.TEAMS, DeletionOperationModel.UPDATE, teamsUpdated, 0);
	}

	private async removeUser(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUser', deletionRequest });

		const userDeleted: number = await this.userService.deleteUser(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DomainModel.USER, DeletionOperationModel.DELETE, 0, userDeleted);
	}

	private async removeUserFromRocketChat(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromRocketChat', deletionRequest });

		const rocketChatUser = await this.rocketChatUserService.findByUserId(deletionRequest.targetRefId);

		const [, rocketChatUserDeleted] = await Promise.all([
			this.rocketChatService.deleteUser(rocketChatUser.username),
			this.rocketChatUserService.deleteByUserId(rocketChatUser.userId),
		]);
		await this.logDeletion(
			deletionRequest,
			DomainModel.ROCKETCHATUSER,
			DeletionOperationModel.DELETE,
			0,
			rocketChatUserDeleted
		);
	}
}
