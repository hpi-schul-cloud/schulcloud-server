import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DomainDeletionReportBuilder } from '../../domain/builder';
import { DeletionLog, DeletionRequest } from '../../domain/do';
import { DataDeletedEvent, UserDeletedEvent } from '../../domain/event';
import { DomainDeletionReport } from '../../domain/interface';
import { DeletionRequestService, DeletionLogService } from '../../domain/service';
import { DeletionRequestLogResponseBuilder } from '../builder';
import { DeletionRequestBodyProps, DeletionRequestResponse, DeletionRequestLogResponse } from '../controller/dto';
import { DeletionTargetRefBuilder } from '../controller/dto/builder';
import { UserDeletedBatchEvent } from '../../domain/event/user-deleted-batch.event';
import { DataDeletedBatchEvent } from '../../domain/event/data-deleted-batch.event';

@Injectable()
@EventsHandler(DataDeletedBatchEvent)
export class DeletionRequestUc implements IEventHandler<DataDeletedBatchEvent> {
	config: string[];

	constructor(
		private readonly deletionRequestService: DeletionRequestService,
		private readonly deletionLogService: DeletionLogService,
		private readonly logger: LegacyLogger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(DeletionRequestUc.name);
		this.config = ['class', 'dashboard'];
		// this.config = [
		// 	'account',
		// 	'class',
		// 	'courseGroup',
		// 	'course',
		// 	'dashboard',
		// 	'file',
		// 	'fileRecords',
		// 	'lessons',
		// 	'pseudonyms',
		// 	'rocketChatUser',
		// 	'task',
		// 	'teams',
		// 	'user',
		// 	'submissions',
		// 	'news',
		// ];
	}

	async handle({ domainDeletionReport }: DataDeletedBatchEvent) {
		// await this.deletionLogService.createDeletionLog(deletionRequestId, domainDeletionReport);
		const createdLogs = await Promise.all(
			domainDeletionReport.map((report: DomainDeletionReport) =>
				report?.deletionRequestId ? this.deletionLogService.createDeletionLog(report.deletionRequestId, report) : null
			)
		);

		if (domainDeletionReport.length === createdLogs.length) {
			// map over array with domainDeletionReport
			// 1 step get deletionlogs per deltionRequestId
			// 2 step check if all domain reports and flag with success
			// 3 step increase counter of sucesfuuly delete data

			// after all array we sholud check if all handled items are finished with succes counter === doeminDeletionReport.length
			// we shold call this.executeDeletionRequest
			// NOT NECCESARY - > if yes we shold check first if are in DB any deletionRequest to execute, if yes we shold call this.executeDeletionRequest

			const isSuccess = await this.checkLogsPerChunk(domainDeletionReport);

			if (isSuccess === domainDeletionReport.length) {
				await this.executeDeletionRequests();
			}
		}
	}

	private async checkLogsPerChunk(domainDeletionReports: DomainDeletionReport[]): Promise<number> {
		let finishedDeletionRequestCounter = 0;

		const deletionLogPromises = domainDeletionReports.map(async (report: DomainDeletionReport) => {
			if (report.deletionRequestId) {
				const deletionLogs = await this.deletionLogService.findByDeletionRequestId(report.deletionRequestId);
				if (deletionLogs && deletionLogs.length > 0) {
					if (this.checkLogsPerDomain(deletionLogs)) {
						await this.deletionRequestService.markDeletionRequestAsExecuted(report.deletionRequestId);
						// eslint-disable-next-line no-plusplus
						finishedDeletionRequestCounter++;
					}
				}
			}
		});

		await Promise.all(deletionLogPromises);

		return finishedDeletionRequestCounter;
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
		const chunk = 10;

		const deletionRequestToExecution: DeletionRequest[] = await this.deletionRequestService.findAllItemsToExecute(
			chunk
		);

		if (deletionRequestToExecution.length > 0) {
			this.logger.debug({ action: 'executeDeletionRequests - array', deletionRequestToExecution });
			await this.executeDeletionRequest(deletionRequestToExecution);
		}
	}

	async findById(deletionRequestId: EntityId): Promise<DeletionRequestLogResponse> {
		this.logger.debug({ action: 'findById', deletionRequestId });

		const deletionRequest: DeletionRequest = await this.deletionRequestService.findById(deletionRequestId);
		let response: DeletionRequestLogResponse = DeletionRequestLogResponseBuilder.build(
			DeletionTargetRefBuilder.build(deletionRequest.targetRefDomain, deletionRequest.targetRefId),
			deletionRequest.deleteAfter,
			deletionRequest.status
		);

		const deletionLog: DeletionLog[] = await this.deletionLogService.findByDeletionRequestId(deletionRequestId);
		const domainOperation: DomainDeletionReport[] = deletionLog.map((log) =>
			DomainDeletionReportBuilder.build(log.domain, log.operations, log.subdomainOperations)
		);
		response = { ...response, statistics: domainOperation };

		return response;
	}

	async deleteDeletionRequestById(deletionRequestId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteDeletionRequestById', deletionRequestId });

		await this.deletionRequestService.deleteById(deletionRequestId);
	}

	private async executeDeletionRequest(deletionRequests: DeletionRequest[]): Promise<void> {
		await this.eventBus.publish(new UserDeletedBatchEvent(deletionRequests));
		deletionRequests.map(async (req) => {
			await this.deletionRequestService.markDeletionRequestAsPending(req.id);
		});
		// try {
		// 	// await this.eventBus.publish(new UserDeletedEvent(deletionRequest.id, deletionRequest.targetRefId));
		// 	await this.deletionRequestService.markDeletionRequestAsPending(deletionRequest.id);
		// } catch (error) {
		// 	this.logger.error(`execution of deletionRequest ${deletionRequest.id} has failed`, error);
		// 	await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);
		// }
	}
}
