import { Logger } from '@core/logger';
import {
	ModuleName,
	SagaService,
	SagaStep,
	StepOperationReport,
	StepOperationReportBuilder,
	StepOperationType,
	StepReport,
	StepReportBuilder,
	StepStatus,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { EntityId } from '@shared/domain/types';
import { AccountService } from '..';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeleteUserAccountDataStep extends SagaStep<'deleteUserData'> {
	constructor(
		private readonly sagaService: SagaService,
		private readonly accountService: AccountService,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserAccountDataStep.name);
		this.sagaService.registerStep(ModuleName.ACCOUNT, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const accountsDeleted = await this.deleteUserAccount(userId);
		const result = StepReportBuilder.build(ModuleName.ACCOUNT, [accountsDeleted]);

		await Promise.resolve();

		return result;
	}

	public async deleteUserAccount(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting account owned by user',
				ModuleName.ACCOUNT,
				userId,
				StepStatus.PENDING
			)
		);

		const deletedAccounts = await this.accountService.deleteByUserId(userId);

		const result = StepOperationReportBuilder.build(StepOperationType.DELETE, deletedAccounts.length, deletedAccounts);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted single Submissions owned by user',
				ModuleName.ACCOUNT,
				userId,
				StepStatus.FINISHED,
				0,
				deletedAccounts.length
			)
		);

		return result;
	}
}
