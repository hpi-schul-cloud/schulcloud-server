import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { DomainDeletionReportBuilder } from '../../domain/builder';
import { DeletionLog, DeletionRequest } from '../../domain/do';
import { DataDeletedEvent, UserDeletedEvent } from '../../domain/event';
import { DeletionConfig, DomainDeletionReport } from '../../domain/interface';
import { DeletionRequestService, DeletionLogService } from '../../domain/service';
import { DeletionRequestLogResponseBuilder } from '../builder';
import { DeletionRequestBodyProps, DeletionRequestResponse, DeletionRequestLogResponse } from '../controller/dto';
import { DeletionTargetRefBuilder } from '../controller/dto/builder';

@Injectable()
@EventsHandler(DataDeletedEvent)
export class DeletionRequestUc implements IEventHandler<DataDeletedEvent> {
	config: string[];

	constructor(
		private readonly deletionRequestService: DeletionRequestService,
		private readonly deletionLogService: DeletionLogService,
		private readonly logger: LegacyLogger,
		private readonly eventBus: EventBus,
		private readonly configService: ConfigService<DeletionConfig, true>
	) {
		this.logger.setContext(DeletionRequestUc.name);
		this.config = [
			'account',
			'board',
			'class',
			'courseGroup',
			'course',
			'dashboard',
			'file',
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

	async handle({ deletionRequestId, domainDeletionReport }: DataDeletedEvent) {
		await this.deletionLogService.createDeletionLog(deletionRequestId, domainDeletionReport);

		const deletionLogs: DeletionLog[] = await this.deletionLogService.findByDeletionRequestId(deletionRequestId);

		if (this.checkLogsPerDomain(deletionLogs)) {
			await this.deletionRequestService.markDeletionRequestAsExecuted(deletionRequestId);
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
		const maxAmoutOfDeletionRequestsDoConcurrently = this.configService.get<number>(
			'ADMIN_API__MAX_AMOUNT_OF_DELETIONREQUESTS_DO_CONCURENTLY'
		);
		const callsDelayMilliseconds = this.configService.get<number>('ADMIN_API__DELETION_DELAY_MILLISECONDS');
		let tasks: DeletionRequest[] = [];

		do {
			const numberOfDeletionRequestsWithStatusPending =
				// eslint-disable-next-line no-await-in-loop
				await this.deletionRequestService.countPendingDeletionRequests();
			const numberOfDeletionRequestsToProccess =
				maxAmoutOfDeletionRequestsDoConcurrently - numberOfDeletionRequestsWithStatusPending;
			this.logger.debug({
				action: 'numberItemsWithStatusPending, amountWillingToTake',
				numberOfDeletionRequestsWithStatusPending,
				numberOfDeletionRequestsToProccess,
			});
			// eslint-disable-next-line no-await-in-loop
			if (numberOfDeletionRequestsToProccess > 0) {
				// eslint-disable-next-line no-await-in-loop
				tasks = await this.deletionRequestService.findAllItemsToExecute(numberOfDeletionRequestsToProccess);
				// eslint-disable-next-line no-await-in-loop
				await Promise.all(
					tasks.map(async (req) => {
						await this.executeDeletionRequest(req);
					})
				);
			}
			// short sleep mode to give time for deletion process to do their work
			if (callsDelayMilliseconds && callsDelayMilliseconds > 0) {
				// eslint-disable-next-line no-await-in-loop
				await new Promise((resolve) => {
					setTimeout(resolve, callsDelayMilliseconds);
				});
			}
		} while (tasks.length > 0);
		this.logger.debug({ action: 'deletion process completed' });
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

	private async executeDeletionRequest(deletionRequest: DeletionRequest): Promise<void> {
		this.logger.debug({ action: 'executeDeletionRequest', deletionRequest });
		try {
			await this.deletionRequestService.markDeletionRequestAsPending(deletionRequest.id);
			await this.eventBus.publish(new UserDeletedEvent(deletionRequest.id, deletionRequest.targetRefId));
		} catch (error) {
			this.logger.error(`execution of deletionRequest ${deletionRequest.id} has failed`, error);
			await this.deletionRequestService.markDeletionRequestAsFailed(deletionRequest.id);
		}
	}
}
