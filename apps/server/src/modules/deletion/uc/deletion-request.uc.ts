import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { PseudonymService } from '@src/modules/pseudonym';
import { UserService } from '@src/modules/user';
import { TeamService } from '@src/modules/teams';
import { ClassService } from '@src/modules/class';
import { LessonService } from '@src/modules/lesson/service';
import { CourseService } from '@src/modules/learnroom/service';
import { CourseGroupService } from '@src/modules/learnroom/service/coursegroup.service';
import { FilesService } from '@src/modules/files/service';
import { AccountService } from '@src/modules/account/services/account.service';
import { DeletionRequestService } from '../services/deletion-request.service';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionLogService } from '../services/deletion-log.service';
import { DeletionRequest } from '../domain/deletion-request.do';
import { DeletionOperationModel } from '../domain/types/deletion-operation-model.enum';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';
import { DeletionLog } from '../domain/deletion-log.do';

export interface DeletionRequestLog {
	targetRef: { domain: DeletionDomainModel; itemId: EntityId };
	deletionPlannedAt: Date;
	statistics?: DeletionLogStatistic[];
}

export interface DeletionLogStatistic {
	domain: DeletionDomainModel;
	modifiedCount?: number;
	deletedCount?: number;
}

export interface DeletionRequestProps {
	targetRef: { domain: DeletionDomainModel; itemId: EntityId };
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
		private readonly userService: UserService
	) {}

	async createDeletionRequest(
		deletionRequest: DeletionRequestProps
	): Promise<{ requestId: EntityId; deletionPlannedAt: Date }> {
		const result = await this.deletionRequestService.createDeletionRequest(
			deletionRequest.targetRef.itemId,
			deletionRequest.targetRef.domain,
			deletionRequest.deleteInMinutes
		);

		return result;
	}

	async executeDeletionRequests(): Promise<void> {
		const deletionRequestToExecution: DeletionRequest[] =
			await this.deletionRequestService.findAllItemsByDeletionDate();

		for (const req of deletionRequestToExecution) {
			// eslint-disable-next-line no-await-in-loop
			await this.executeDeletionRequest(req);
		}
	}

	async findById(deletionRequestId: EntityId): Promise<DeletionRequestLog> {
		const deletionRequest: DeletionRequest = await this.deletionRequestService.findById(deletionRequestId);
		let response: DeletionRequestLog = {
			targetRef: {
				domain: deletionRequest.domain,
				itemId: deletionRequest.itemId,
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
		await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequest.id);

		const [
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
		] = await Promise.all([
			this.accountService.deleteByUserId(deletionRequest.itemId),
			this.classService.deleteUserDataFromClasses(deletionRequest.itemId),
			this.courseGroupService.deleteUserDataFromCourseGroup(deletionRequest.itemId),
			this.courseService.deleteUserDataFromCourse(deletionRequest.itemId),
			this.filesService.markFilesOwnedByUserForDeletion(deletionRequest.itemId),
			this.filesService.removeUserPermissionsToAnyFiles(deletionRequest.itemId),
			this.lessonService.deleteUserDataFromLessons(deletionRequest.itemId),
			this.pseudonymService.deleteByUserId(deletionRequest.itemId),
			this.teamService.deleteUserDataFromTeams(deletionRequest.itemId),
			this.userService.deleteUser(deletionRequest.itemId),
		]);

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
	}
}
