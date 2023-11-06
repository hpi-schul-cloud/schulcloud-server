import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions } from '@shared/domain';
import { PseudonymService } from '@src/modules/pseudonym';
import { UserService } from '@src/modules/user';
import { TeamService } from '@src/modules/teams';
import { ClassService } from '@src/modules/class';
import { LessonService } from '@src/modules/lesson/service';
import { CourseService } from '@src/modules/learnroom/service';
import { CourseGroupService } from '@src/modules/learnroom/service/coursegroup.service';
import { FilesService } from '@src/modules/files/service';
import { AccountService } from '@src/modules/account/services/account.service';
import { RocketChatService } from '@src/modules/rocketchat';
import { RocketChatUserService } from '@src/modules/rocketchat-user/service/rocket-chat-user.service';
import { DeletionRequestService } from '../services/deletion-request.service';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionLogService } from '../services/deletion-log.service';
import { DeletionRequest } from '../domain/deletion-request.do';
import { DeletionOperationModel } from '../domain/types/deletion-operation-model.enum';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';
import { DeletionLog } from '../domain/deletion-log.do';

export interface DeletionRequestLog {
	targetRef: { targetRefDoamin: DeletionDomainModel; targetRefId: EntityId };
	deletionPlannedAt: Date;
	statistics?: DeletionLogStatistic[];
}

export interface DeletionLogStatistic {
	domain: DeletionDomainModel;
	modifiedCount?: number;
	deletedCount?: number;
}

export interface DeletionRequestProps {
	targetRef: { targetRefDoamin: DeletionDomainModel; targetRefId: EntityId };
	deleteInMinutes?: number;
}

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
		private readonly rocketChatService: RocketChatService
	) {}

	async createDeletionRequest(
		deletionRequest: DeletionRequestProps
	): Promise<{ requestId: EntityId; deletionPlannedAt: Date }> {
		const result = await this.deletionRequestService.createDeletionRequest(
			deletionRequest.targetRef.targetRefId,
			deletionRequest.targetRef.targetRefDoamin,
			deletionRequest.deleteInMinutes
		);

		return result;
	}

	async executeDeletionRequests(options?: IFindOptions<DeletionRequest>): Promise<void> {
		const deletionRequestToExecution: DeletionRequest[] = await this.deletionRequestService.findAllItemsToExecute(
			options
		);

		for (const req of deletionRequestToExecution) {
			// eslint-disable-next-line no-await-in-loop
			await this.executeDeletionRequest(req);
		}
	}

	async findById(deletionRequestId: EntityId): Promise<DeletionRequestLog> {
		const deletionRequest: DeletionRequest = await this.deletionRequestService.findById(deletionRequestId);
		let response: DeletionRequestLog = {
			targetRef: {
				targetRefDoamin: deletionRequest.targetRefDomain,
				targetRefId: deletionRequest.targetRefId,
			},
			deletionPlannedAt: deletionRequest.deleteAfter,
		};

		if (deletionRequest.status === DeletionStatusModel.SUCCESS) {
			const deletionLog: DeletionLog[] = await this.deletionLogService.findByDeletionRequestId(deletionRequestId);
			const deletionLogStatistic: DeletionLogStatistic[] = deletionLog.map((log) => {
				return {
					domain: log.domain,
					modifiedCount: log.modifiedCount,
					deletedCount: log.deletedCount,
				};
			});
			response = { ...response, statistics: deletionLogStatistic };
		}

		return response;
	}

	async deleteDeletionRequestById(deletionRequestId: EntityId): Promise<void> {
		await this.deletionRequestService.deleteById(deletionRequestId);
	}

	private async executeDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		await Promise.all([
			this.accountService.deleteByUserId(deletionRequest.targetRefId),
			this.classService.deleteUserDataFromClasses(deletionRequest.targetRefId),
			this.courseGroupService.deleteUserDataFromCourseGroup(deletionRequest.targetRefId),
			this.courseService.deleteUserDataFromCourse(deletionRequest.targetRefId),
			this.filesService.markFilesOwnedByUserForDeletion(deletionRequest.targetRefId),
			this.filesService.removeUserPermissionsToAnyFiles(deletionRequest.targetRefId),
			this.lessonService.deleteUserDataFromLessons(deletionRequest.targetRefId),
			this.pseudonymService.deleteByUserId(deletionRequest.targetRefId),
			this.teamService.deleteUserDataFromTeams(deletionRequest.targetRefId),
			this.userService.deleteUser(deletionRequest.targetRefId),
			this.removeUserFromRocketChatByUserId(deletionRequest.targetRefId),
		])
			.then(
				async ([
					,
					classesUpdated,
					courseGroupUpdated,
					courseUpdated,
					fileDeleted,
					filesPermisionUpdated,
					lessonUpdated,
					pseudonymDeleted,
					teamsUpdated,
					userDeleted,
					rocketChatUserDeleted,
				]) => {
					await this.deletionLogService.createDeletionLog(
						deletionRequest.id,
						DeletionDomainModel.ACCOUNT,
						DeletionOperationModel.DELETE,
						0,
						1
					);

					if (classesUpdated > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.CLASS,
							DeletionOperationModel.UPDATE,
							classesUpdated,
							0
						);
					}

					if (classesUpdated > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.CLASS,
							DeletionOperationModel.UPDATE,
							classesUpdated,
							0
						);
					}

					if (courseGroupUpdated > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.COURSEGROUP,
							DeletionOperationModel.UPDATE,
							courseGroupUpdated,
							0
						);
					}

					if (courseUpdated > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.COURSE,
							DeletionOperationModel.UPDATE,
							courseUpdated,
							0
						);
					}

					if (fileDeleted > 0 || filesPermisionUpdated > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.FILE,
							DeletionOperationModel.UPDATE,
							fileDeleted + filesPermisionUpdated,
							0
						);
					}

					if (lessonUpdated > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.LESSONS,
							DeletionOperationModel.UPDATE,
							lessonUpdated,
							0
						);
					}

					if (pseudonymDeleted > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.PSEUDONYMS,
							DeletionOperationModel.DELETE,
							0,
							pseudonymDeleted
						);
					}

					if (teamsUpdated > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.TEAMS,
							DeletionOperationModel.UPDATE,
							teamsUpdated,
							0
						);
					}

					if (userDeleted > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.USER,
							DeletionOperationModel.DELETE,
							0,
							userDeleted
						);
					}

					if (rocketChatUserDeleted > 0) {
						await this.deletionLogService.createDeletionLog(
							deletionRequest.id,
							DeletionDomainModel.ROCKETCHATUSER,
							DeletionOperationModel.DELETE,
							0,
							rocketChatUserDeleted
						);
					}

					await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequest.id);

					return true;
				}
			)
			.catch(async () => {
				await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);
			});
	}

	private async removeUserFromRocketChatByUserId(userId: EntityId): Promise<number> {
		const rocketChatUser = await this.rocketChatUserService.findByUserId(userId);

		if (!rocketChatUser) {
			return 0;
		}

		const [, rocketChatUserDeleted] = await Promise.all([
			this.rocketChatService.deleteUser(rocketChatUser.username),
			this.rocketChatUserService.deleteByUserId(rocketChatUser.userId),
		]);

		return rocketChatUserDeleted;
	}
}
