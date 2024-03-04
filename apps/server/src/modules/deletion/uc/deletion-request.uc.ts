import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { DomainDeletionReport } from '@shared/domain/interface';
import { DomainDeletionReportBuilder } from '@shared/domain/builder/domain-deletion-report.builder';
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
		private readonly logger: LegacyLogger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(DeletionRequestUc.name);
		this.config = [
			'account',
			'class',
			'courseGroup',
			'course',
			'dashboard',
			'files',
			'fileRecords',
			'lessons',
			'pseudonyms',
			'rocketChatUser',
			'task',
			'teams',
			'user',
			'submissions',
			'news',
		];
	}

	async handle({ deletionRequest, domainDeletionReport }: DataDeletedEvent) {
		await this.logDeletion(deletionRequest, domainDeletionReport);

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
		// await Promise.all(
		// 	deletionRequestToExecution.map(async (req) => {
		// 		await this.executeDeletionRequest(req);
		// 	})
		// );
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
			DomainDeletionReportBuilder.build(log.domain, log.domainOperationReport, log.domainDeletionReport)
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
			await this.eventBus.publish(new UserDeletedEvent(deletionRequest));
			await this.deletionRequestService.markDeletionRequestAsPending(deletionRequest.id);
		} catch (error) {
			this.logger.error(`execution of deletionRequest ${deletionRequest.id} was failed`, error);
			await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);
		}
	}

	private async logDeletion(
		deletionRequest: DeletionRequest,
		domainDeletionReport: DomainDeletionReport
	): Promise<void> {
		await this.deletionLogService.createDeletionLog(deletionRequest.id, domainDeletionReport);
	}
}
