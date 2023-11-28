import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { PseudonymService } from '@modules/pseudonym';
import { UserService } from '@modules/user';
import { TeamService } from '@modules/teams';
import { ClassService } from '@modules/class';
import { LessonService } from '@modules/lesson/service';
import { CourseGroupService, CourseService } from '@modules/learnroom/service';
import { FilesService } from '@modules/files/service';
import { AccountService } from '@modules/account/services';
import { RocketChatUserService } from '@modules/rocketchat-user';
import { RocketChatService } from '@modules/rocketchat';
import { RegistrationPinService } from '@modules/registration-pin';
import { DeletionRequestService } from '../services/deletion-request.service';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionLogService } from '../services/deletion-log.service';
import { DeletionRequest } from '../domain/deletion-request.do';
import { DeletionOperationModel } from '../domain/types/deletion-operation-model.enum';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';
import { DeletionLog } from '../domain/deletion-log.do';
import {
	DeletionRequestProps,
	DeletionRequestLog,
	DeletionLogStatistic,
	DeletionRequestCreateAnswer,
} from './interface/interfaces';
import { DeletionLogStatisticBuilder } from './builder/deletion-log-statistic.builder';
import { DeletionRequestLogBuilder } from './builder/deletion-request-log.builder';
import { DeletionTargetRefBuilder } from './builder/deletion-target-ref.builder';

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
		private readonly registrationPinService: RegistrationPinService
	) {}

	async createDeletionRequest(deletionRequest: DeletionRequestProps): Promise<DeletionRequestCreateAnswer> {
		const result = await this.deletionRequestService.createDeletionRequest(
			deletionRequest.targetRef.targetRefId,
			deletionRequest.targetRef.targetRefDoamin,
			deletionRequest.deleteInMinutes
		);

		return result;
	}

	async executeDeletionRequests(limit?: number): Promise<void> {
		const deletionRequestToExecution: DeletionRequest[] = await this.deletionRequestService.findAllItemsToExecute(
			limit
		);

		for (const req of deletionRequestToExecution) {
			// eslint-disable-next-line no-await-in-loop
			await this.executeDeletionRequest(req);
		}
	}

	async findById(deletionRequestId: EntityId): Promise<DeletionRequestLog> {
		const deletionRequest: DeletionRequest = await this.deletionRequestService.findById(deletionRequestId);
		let response: DeletionRequestLog = DeletionRequestLogBuilder.build(
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
				this.removeUserFromLessons(deletionRequest),
				this.removeUsersPseudonyms(deletionRequest),
				this.removeUserFromTeams(deletionRequest),
				this.removeUser(deletionRequest),
				this.removeUserFromRocketChat(deletionRequest),
				this.removeUserRegistrationPin(deletionRequest),
			]);
			await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequest.id);
		} catch (error) {
			await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);
		}
	}

	private async logDeletion(
		deletionRequest: DeletionRequest,
		domainModel: DeletionDomainModel,
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
		await this.accountService.deleteByUserId(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DeletionDomainModel.ACCOUNT, DeletionOperationModel.DELETE, 0, 1);
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
			DeletionDomainModel.REGISTRATIONPIN,
			DeletionOperationModel.DELETE,
			0,
			deletedRegistrationPin
		);
	}

	private async removeUserFromClasses(deletionRequest: DeletionRequest) {
		const classesUpdated: number = await this.classService.deleteUserDataFromClasses(deletionRequest.targetRefId);
		await this.logDeletion(
			deletionRequest,
			DeletionDomainModel.CLASS,
			DeletionOperationModel.UPDATE,
			classesUpdated,
			0
		);
	}

	private async removeUserFromCourseGroup(deletionRequest: DeletionRequest) {
		const courseGroupUpdated: number = await this.courseGroupService.deleteUserDataFromCourseGroup(
			deletionRequest.targetRefId
		);
		await this.logDeletion(
			deletionRequest,
			DeletionDomainModel.COURSEGROUP,
			DeletionOperationModel.UPDATE,
			courseGroupUpdated,
			0
		);
	}

	private async removeUserFromCourse(deletionRequest: DeletionRequest) {
		const courseUpdated: number = await this.courseService.deleteUserDataFromCourse(deletionRequest.targetRefId);
		await this.logDeletion(
			deletionRequest,
			DeletionDomainModel.COURSE,
			DeletionOperationModel.UPDATE,
			courseUpdated,
			0
		);
	}

	private async removeUsersFilesAndPermissions(deletionRequest: DeletionRequest) {
		const filesDeleted: number = await this.filesService.markFilesOwnedByUserForDeletion(deletionRequest.targetRefId);
		const filePermissionsUpdated: number = await this.filesService.removeUserPermissionsToAnyFiles(
			deletionRequest.targetRefId
		);
		await this.logDeletion(
			deletionRequest,
			DeletionDomainModel.FILE,
			DeletionOperationModel.UPDATE,
			filesDeleted + filePermissionsUpdated,
			0
		);
	}

	private async removeUserFromLessons(deletionRequest: DeletionRequest) {
		const lessonsUpdated: number = await this.lessonService.deleteUserDataFromLessons(deletionRequest.targetRefId);
		await this.logDeletion(
			deletionRequest,
			DeletionDomainModel.LESSONS,
			DeletionOperationModel.UPDATE,
			lessonsUpdated,
			0
		);
	}

	private async removeUsersPseudonyms(deletionRequest: DeletionRequest) {
		const pseudonymDeleted: number = await this.pseudonymService.deleteByUserId(deletionRequest.targetRefId);
		await this.logDeletion(
			deletionRequest,
			DeletionDomainModel.PSEUDONYMS,
			DeletionOperationModel.DELETE,
			0,
			pseudonymDeleted
		);
	}

	private async removeUserFromTeams(deletionRequest: DeletionRequest) {
		const teamsUpdated: number = await this.teamService.deleteUserDataFromTeams(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DeletionDomainModel.TEAMS, DeletionOperationModel.UPDATE, teamsUpdated, 0);
	}

	private async removeUser(deletionRequest: DeletionRequest) {
		const userDeleted: number = await this.userService.deleteUser(deletionRequest.targetRefId);
		await this.logDeletion(deletionRequest, DeletionDomainModel.USER, DeletionOperationModel.DELETE, 0, userDeleted);
	}

	private async removeUserFromRocketChat(deletionRequest: DeletionRequest): Promise<number> {
		const rocketChatUser = await this.rocketChatUserService.findByUserId(deletionRequest.targetRefId);

		const [, rocketChatUserDeleted] = await Promise.all([
			this.rocketChatService.deleteUser(rocketChatUser.username),
			this.rocketChatUserService.deleteByUserId(rocketChatUser.userId),
		]);

		return rocketChatUserDeleted;
	}
}
