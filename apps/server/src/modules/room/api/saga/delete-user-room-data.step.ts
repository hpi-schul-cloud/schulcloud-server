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
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomArrangementService } from '../../domain';

@Injectable()
export class DeleteUserRoomDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.ROOM;

	constructor(
		private readonly sagaService: SagaService,
		private readonly roomArrangementService: RoomArrangementService,
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

	private async removeUserReferences(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable('Deleting user data from Room', this.moduleName, userId, StepStatus.PENDING)
		);

		const deletedIds = await this.roomArrangementService.deleteArrangements(userId);
		const deletedCount = deletedIds.length;

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
