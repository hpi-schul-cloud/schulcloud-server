import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@core/logger';
import { DomainDeletionReportBuilder } from '../../domain/builder';
import { DeletionLog, DeletionRequest } from '../../domain/do';
import { DataDeletedEvent, UserDeletedEvent } from '../../domain/event';
import { DomainDeletionReport } from '../../domain/interface';
import { DeletionLogService, DeletionRequestService } from '../../domain/service';
import { DeletionRequestLogResponseBuilder } from '../builder';
import { DeletionRequestBodyProps, DeletionRequestLogResponse, DeletionRequestResponse } from '../controller/dto';
import { DeletionTargetRefBuilder } from '../controller/dto/builder';
import { DeletionConfig } from '../../deletion.config';

@Injectable()
@EventsHandler(DataDeletedEvent)
export class DeletionRequestUc implements IEventHandler<DataDeletedEvent> {
	private config: string[];

	constructor(
		private readonly deletionRequestService: DeletionRequestService,
		private readonly deletionLogService: DeletionLogService,
		private readonly logger: LegacyLogger,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM,
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
			'news',
			'pseudonyms',
			'rocketChatUser',
			'submissions',
			'task',
			'teams',
			'user',
		];
	}

	@UseRequestContext()
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
		const minutes =
			deletionRequest.deleteAfterMinutes ?? this.configService.get<number>('ADMIN_API__DELETION_DELETE_AFTER_MINUTES');
		const deleteAfter = new Date();
		deleteAfter.setMinutes(deleteAfter.getMinutes() + minutes);
		const result = await this.deletionRequestService.createDeletionRequest(
			deletionRequest.targetRef.id,
			deletionRequest.targetRef.domain,
			deleteAfter
		);

		return result;
	}

	async executeDeletionRequests(limit?: number, getFailed?: boolean): Promise<void> {
		this.logger.debug({ action: 'executeDeletionRequests', limit });

		let deletionRequests: DeletionRequest[] = [];
		const configLimit = this.configService.get<number>('ADMIN_API__DELETION_MAX_CONCURRENT_DELETION_REQUESTS');
		do {
			// eslint-disable-next-line no-await-in-loop
			const inProgress = await this.deletionRequestService.findInProgressCount();

			const max = limit ? limit - inProgress : configLimit - inProgress;

			// eslint-disable-next-line no-await-in-loop
			deletionRequests = await this.deletionRequestService.findAllItemsToExecute(max, getFailed);

			if (max > 0) {
				this.logger.debug({ action: 'processing deletion request', deletionRequests });

				// eslint-disable-next-line no-await-in-loop
				await Promise.all(
					deletionRequests.map(async (req) => {
						await this.executeDeletionRequest(req);
					})
				);

				// eslint-disable-next-line no-await-in-loop
				await this.delayForDeletion();
			}
		} while (deletionRequests.length > 0);

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

	private async delayForDeletion() {
		const delay = this.configService.get<number>('ADMIN_API__DELETION_DELAY_MILLISECONDS');
		if (delay > 0) {
			return new Promise((resolve) => {
				setTimeout(resolve, delay);
			});
		}

		return Promise.resolve();
	}
}
