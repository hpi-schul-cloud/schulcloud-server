import { LegacyLogger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain/types';
import { AccountService } from '@modules/account';
import { UserService } from '@modules/user';
import { DeletionConfig } from '../../deletion.config';
import { DomainDeletionReportBuilder } from '../../domain/builder';
import { DeletionLog, DeletionRequest } from '../../domain/do';
import { DomainDeletionReport } from '../../domain/interface';
import { DeletionLogService, DeletionRequestService, DeletionExecutionService } from '../../domain/service';
import { DeletionRequestLogResponseBuilder } from '../builder';
import { DeletionRequestBodyParams, DeletionRequestLogResponse, DeletionRequestResponse } from '../controller/dto';
import { DeletionTargetRefBuilder } from '../controller/dto/builder';
import { DomainName } from '../../domain/types';

@Injectable()
export class DeletionRequestUc {
	constructor(
		private readonly configService: ConfigService<DeletionConfig, true>,
		private readonly deletionRequestService: DeletionRequestService,
		private readonly deletionLogService: DeletionLogService,
		private readonly deletionExecutionService: DeletionExecutionService,
		private readonly logger: LegacyLogger,
		private readonly accountService: AccountService,
		private readonly userService: UserService
	) {
		this.logger.setContext(DeletionRequestUc.name);
	}

	public async createDeletionRequest(deletionRequest: DeletionRequestBodyParams): Promise<DeletionRequestResponse> {
		this.logger.debug({ action: 'createDeletionRequest', deletionRequest });
		const minutes =
			deletionRequest.deleteAfterMinutes ?? this.configService.get<number>('ADMIN_API__DELETION_DELETE_AFTER_MINUTES');
		const deleteAfter = new Date();
		deleteAfter.setMinutes(deleteAfter.getMinutes() + minutes);

		// TODO automatic check if targetRefId exists for any domains
		if (deletionRequest.targetRef.domain === DomainName.USER) {
			await this.userService.findById(deletionRequest.targetRef.id);
		}

		const result = await this.deletionRequestService.createDeletionRequest(
			deletionRequest.targetRef.id,
			deletionRequest.targetRef.domain,
			deleteAfter
		);

		if (deletionRequest.targetRef.domain === DomainName.USER) {
			const deleteAt = new Date();
			await this.userService.flagAsDeleted(deletionRequest.targetRef.id, deleteAt);
			try {
				await this.accountService.deactivateAccount(deletionRequest.targetRef.id, deleteAt);
			} catch (error) {
				this.logger.warn({ action: 'createDeletionRequest', 'Account not deactivated. Probably not found.' });
			}
		}

		return result;
	}

	public async executeDeletionRequests(deletionRequestIds: EntityId[]): Promise<void> {
		this.logger.debug({ action: 'executeDeletionRequests', deletionRequestIds });

		const deletionRequests = await this.deletionRequestService.findByIds(deletionRequestIds);
		for (const req of deletionRequests) {
			if (req !== null) {
				await this.deletionExecutionService.executeDeletionRequest(req);
			}
		}

		this.logger.debug({ action: 'deletion requests executed' });
	}

	public async findAllItemsToExecute(limit?: number, getFailed?: boolean): Promise<EntityId[]> {
		this.logger.debug({ action: 'findAllItemsToExecute', limit });

		const configLimit = this.configService.get<number>('ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER');
		const max = limit ?? configLimit;
		const deletionRequests = await this.deletionRequestService.findAllItemsToExecute(max, getFailed);
		const deletionRequestIds = deletionRequests.map((deletionRequest) => deletionRequest.id);

		return deletionRequestIds;
	}

	public async findById(deletionRequestId: EntityId): Promise<DeletionRequestLogResponse> {
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

	public async deleteDeletionRequestById(deletionRequestId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteDeletionRequestById', deletionRequestId });

		const deletionRequest = await this.deletionRequestService.findById(deletionRequestId);

		await this.deletionRequestService.deleteById(deletionRequestId);

		if (deletionRequest.targetRefDomain === DomainName.USER) {
			await this.accountService.reactivateAccount(deletionRequest.targetRefId);
		}
	}
}
