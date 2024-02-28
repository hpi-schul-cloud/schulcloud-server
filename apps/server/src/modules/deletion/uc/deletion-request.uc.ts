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
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { SubmissionService, TaskService } from '@modules/task';
import { DomainDeletionReport } from '@shared/domain/interface';
import { DomainDeletionReportBuilder } from '@shared/domain/builder/domain-deletion-report.builder';
import { NewsService } from '@src/modules/news/service/news.service';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DeletionRequestLogResponseBuilder, DeletionTargetRefBuilder } from '../builder';
import { DeletionRequestBodyProps, DeletionRequestLogResponse, DeletionRequestResponse } from '../controller/dto';
import { DeletionRequest, DeletionLog } from '../domain';
import { DeletionRequestService, DeletionLogService } from '../services';
import { UserDeletedEvent } from '../event';
import { DataDeletedEvent } from '../event/data-deleted.event';

@Injectable()
@EventsHandler(DataDeletedEvent)
export class DeletionRequestUc implements IEventHandler<DataDeletedEvent> {
	config: string[];

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
		private readonly taskService: TaskService,
		private readonly submissionService: SubmissionService,
		private readonly newsService: NewsService,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(DeletionRequestUc.name);
		this.config = [
			'account',
			'class',
			'courseGroup',
			'course',
			'dashboard',
			// 'file',
			// 'fileRecords',
			'lessons',
			// 'pseudonyms',
			// 'registrationPin',
			// 'rocketChatUser',
			// 'rocketChatService',
			// 'task',
			'teams',
			'user',
			// 'submissions',
			// 'news',
		];
	}

	async handle({ deletionRequest, domainOperation }: DataDeletedEvent) {
		// check that the domainOperation contains a count of 0 and has not previously been stored in DB
		// if so, do not log it
		await this.logDeletion(deletionRequest, domainOperation);

		// code below should be executed by external cronjob
		const deletionLogs: DeletionLog[] = await this.deletionLogService.findByDeletionRequestId(deletionRequest.id);

		if (this.checkLogsPerDomain(deletionLogs)) {
			await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequest.id);
		}
	}

	private checkLogsPerDomain(deletionLogs: DeletionLog[]): boolean {
		return this.config.every((domain) => deletionLogs.some((log) => log.domain === domain));
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
		const domainOperation: DomainDeletionReport[] = deletionLog.map((log) =>
			DomainDeletionReportBuilder.build(log.domain, log.operation, log.count, log.refs)
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
			// await Promise.all([
			// this.removeAccount(deletionRequest),
			// this.removeUserFromClasses(deletionRequest),
			// this.removeUserFromCourseGroup(deletionRequest),
			// this.removeUserFromCourse(deletionRequest),
			// // this.removeUsersFilesAndPermissions(deletionRequest),
			// // this.removeUsersDataFromFileRecords(deletionRequest),
			// this.removeUserFromLessons(deletionRequest),
			// this.removeUsersPseudonyms(deletionRequest),
			// this.removeUserFromTeams(deletionRequest),
			// this.removeUser(deletionRequest),
			// // this.removeUserFromRocketChat(deletionRequest),
			// this.removeUsersDashboard(deletionRequest),
			// this.removeUserFromTasks(deletionRequest),
			// this.removeUserFromSubmissions(deletionRequest),
			// this.removeUsersDataFromNews(deletionRequest),
			// ]);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			await this.eventBus.publish(new UserDeletedEvent(deletionRequest));
			await this.deletionRequestService.markDeletionRequestAsPending(deletionRequest.id);
		} catch (error) {
			this.logger.error(`execution of deletionRequest ${deletionRequest.id} was failed`, error);
			await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);
		}
	}

	private async logDeletion(deletionRequest: DeletionRequest, domainOperation: DomainDeletionReport): Promise<void> {
		await this.deletionLogService.createDeletionLog(
			deletionRequest.id,
			domainOperation.domain,
			domainOperation.operation,
			domainOperation.count,
			domainOperation.refs
		);
	}

	private async removeAccount(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeAccount', deletionRequest });

		const accountDeleted: DomainDeletionReport = await this.accountService.deleteUserData(deletionRequest.targetRefId);

		await this.logDeletion(deletionRequest, accountDeleted);
	}

	private async removeUserRegistrationPin(deletionRequest: DeletionRequest): Promise<number> {
		const userToDeletion = await this.userService.findByIdOrNull(deletionRequest.targetRefId);
		const parentEmails = await this.userService.getParentEmailsFromUser(deletionRequest.targetRefId);
		let emailsToDeletion: string[] = [];
		if (userToDeletion !== null) {
			emailsToDeletion = [userToDeletion.email, ...parentEmails];
		}

		const results = await Promise.all(
			emailsToDeletion.map((email) => this.registrationPinService.deleteUserData(email))
		);

		const result = this.getDomainOperation(results);

		await this.logDeletion(deletionRequest, result);

		return result.count;
	}

	private getDomainOperation(results: DomainDeletionReport[]) {
		return results.reduce(
			(acc, current) => {
				acc.count += current.count;
				acc.refs = [...acc.refs, ...current.refs];

				return acc;
			},
			{
				domain: results[0].domain,
				operation: results[0].operation,
				count: 0,
				refs: [],
			}
		);
	}

	private async removeUserFromClasses(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromClasses', deletionRequest });

		const classesUpdated: DomainDeletionReport = await this.classService.deleteUserData(deletionRequest.targetRefId);

		await this.logDeletion(deletionRequest, classesUpdated);
	}

	private async removeUserFromCourseGroup(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromCourseGroup', deletionRequest });

		const courseGroupUpdated: DomainDeletionReport = await this.courseGroupService.deleteUserData(
			deletionRequest.targetRefId
		);

		await this.logDeletion(deletionRequest, courseGroupUpdated);
	}

	private async removeUserFromCourse(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromCourse', deletionRequest });

		const courseUpdated: DomainDeletionReport = await this.courseService.deleteUserData(deletionRequest.targetRefId);

		await this.logDeletion(deletionRequest, courseUpdated);
	}

	private async removeUsersDashboard(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersDashboard', deletionRequest });

		const dashboardDeleted: DomainDeletionReport = await this.dashboardService.deleteUserData(deletionRequest.targetRefId);

		await this.logDeletion(deletionRequest, dashboardDeleted);
	}

	// private async removeUsersFilesAndPermissions(deletionRequest: DeletionRequest) {
	// 	this.logger.debug({ action: 'removeUsersFilesAndPermissions', deletionRequest });

	// 	const filesDeleted = await this.filesService.markFilesOwnedByUserForDeletion(deletionRequest.targetRefId);
	// 	const filesUpdated = await this.filesService.removeUserPermissionsOrCreatorReferenceToAnyFiles(
	// 		deletionRequest.targetRefId
	// 	);

	// 	const result = this.getDomainOperation([filesDeleted, filesUpdated]);

	// 	await this.logDeletion(deletionRequest, result.domain, result.operation, result.count, result.refs);
	// }

	// private async removeUsersDataFromFileRecords(deletionRequest: DeletionRequest) {
	// 	this.logger.debug({ action: 'removeUsersDataFromFileRecords', deletionRequest });

	// 	const fileRecordsUpdated = await this.filesStorageClientAdapterService.removeCreatorIdFromFileRecords(
	// 		deletionRequest.targetRefId
	// 	);

	// 	await this.logDeletion(
	// 		deletionRequest,
	// 		fileRecordsUpdated.domain,
	// 		fileRecordsUpdated.operation,
	// 		fileRecordsUpdated.count,
	// 		fileRecordsUpdated.refs
	// 	);
	// }

	private async removeUserFromLessons(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromLessons', deletionRequest });

		const lessonsUpdated: DomainDeletionReport = await this.lessonService.deleteUserData(deletionRequest.targetRefId);

		await this.logDeletion(deletionRequest, lessonsUpdated);
	}

	private async removeUsersPseudonyms(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersPseudonyms', deletionRequest });

		const pseudonymsDeleted: DomainDeletionReport = await this.pseudonymService.deleteUserData(deletionRequest.targetRefId);

		await this.logDeletion(deletionRequest, pseudonymsDeleted);
	}

	private async removeUserFromTeams(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: ' removeUserFromTeams', deletionRequest });

		const teamsUpdated: DomainDeletionReport = await this.teamService.deleteUserData(deletionRequest.targetRefId);

		await this.logDeletion(deletionRequest, teamsUpdated);
	}

	private async removeUser(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUser', deletionRequest });

		const registrationPinDeleted = await this.removeUserRegistrationPin(deletionRequest);

		if (registrationPinDeleted >= 0) {
			const userDeleted: DomainDeletionReport = await this.userService.deleteUserData(deletionRequest.targetRefId);
			await this.logDeletion(deletionRequest, userDeleted);
		}
	}

	// private async removeUserFromRocketChat(deletionRequest: DeletionRequest) {
	// 	this.logger.debug({ action: 'removeUserFromRocketChat', deletionRequest });

	// 	const rocketChatUser = await this.rocketChatUserService.findByUserId(deletionRequest.targetRefId);

	// 	if (rocketChatUser.length > 0) {
	// 		const [rocketChatDeleted, rocketChatUserDeleted] = await Promise.all([
	// 			this.rocketChatService.deleteUser(rocketChatUser[0].username),
	// 			this.rocketChatUserService.deleteByUserId(rocketChatUser[0].userId),
	// 		]);

	// 		await this.logDeletion(
	// 			deletionRequest,
	// 			rocketChatUserDeleted.domain,
	// 			rocketChatUserDeleted.operation,
	// 			rocketChatUserDeleted.count,
	// 			rocketChatUserDeleted.refs
	// 		);

	// 		if (rocketChatDeleted) {
	// 			await this.logDeletion(deletionRequest, DomainName.ROCKETCHATSERVICE, OperationType.DELETE, 1, [
	// 				rocketChatUser[0].username,
	// 			]);
	// 		}
	// 	}
	// }

	private async removeUserFromTasks(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromTasks', deletionRequest });

		const modifiedData: DomainDeletionReport[] = await this.taskService.deleteUserData(deletionRequest.targetRefId);

		// deleted task
		await this.logDeletion(deletionRequest, modifiedData[0]);

		// updated Task
		await this.logDeletion(deletionRequest, modifiedData[1]);
	}

	private async removeUserFromSubmissions(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUserFromSubmissions', deletionRequest });

		const modifiedData: DomainDeletionReport[] = await this.submissionService.deleteUserData(deletionRequest.targetRefId);

		// deleted Submissions
		await this.logDeletion(deletionRequest, modifiedData[0]);

		// updated Submissions
		await this.logDeletion(deletionRequest, modifiedData[1]);
	}

	private async removeUsersDataFromNews(deletionRequest: DeletionRequest) {
		this.logger.debug({ action: 'removeUsersDataFromNews', deletionRequest });
		const newsModified = await this.newsService.deleteUserData(deletionRequest.targetRefId);

		await this.logDeletion(deletionRequest, newsModified);
	}
}
