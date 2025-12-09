import { Logger } from '@core/logger';
import { RoomArrangementRepo } from '../../repo';
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
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class DeleteUserRoomDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.ROOM;

	constructor(
		private readonly sagaService: SagaService,
		private readonly roomArrangementRepo: RoomArrangementRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserRoomDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const userReferencesRemoved = await this.removeUserReferences(userId);

		const result = StepReportBuilder.build(this.moduleName, [userReferencesRemoved]);

		return result;
	}

	public async removeUserReferences(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable('Deleting user data from Room', this.moduleName, userId, StepStatus.PENDING)
		);

		const arragementId = await this.roomArrangementRepo.deleteArrangement(userId);
		const deletedCount = arragementId ? 1 : 0;
		const deletedIds = arragementId ? [arragementId] : [];

		const result = StepOperationReportBuilder.build(StepOperationType.DELETE, deletedCount, deletedIds);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully removed user data from Room',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				0,
				deletedCount
			)
		);
		return result;
	}
}
