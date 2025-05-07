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
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalToolPseudonymRepo } from '../repo';

@Injectable()
export class DeleteUserPseudonymDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.PSEUDONYM;

	constructor(
		private readonly sagaService: SagaService,
		private readonly externalToolPseudonymRepo: ExternalToolPseudonymRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserPseudonymDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}
	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		if (!userId) {
			throw new InternalServerErrorException('User ID is required');
		}

		const userPseudonymsDeleted = await this.deleteUserPseudonyms(userId);

		const result = StepReportBuilder.build(this.moduleName, [userPseudonymsDeleted]);

		return result;
	}

	public async deleteUserPseudonyms(userId: string): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user data from Pseudonyms',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);

		const deletedPseudonymIds = await this.externalToolPseudonymRepo.deletePseudonymsByUserId(userId);

		const result = StepOperationReportBuilder.build(
			StepOperationType.DELETE,
			deletedPseudonymIds.length,
			deletedPseudonymIds
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted user data from Pseudonyms',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				0,
				deletedPseudonymIds.length
			)
		);

		return result;
	}
}
