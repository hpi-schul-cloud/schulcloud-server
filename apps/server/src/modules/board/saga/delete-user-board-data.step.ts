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
import { BoardExternalReferenceType } from '../domain';
import { BoardNodeService, MediaBoardService } from '../service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeleteUserBoardDataStep extends SagaStep<'deleteUserData'> {
	private readonly moduleName = ModuleName.BOARD;

	constructor(
		private readonly sagaService: SagaService,
		private readonly boardNodeService: BoardNodeService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserBoardDataStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const boardsDeleted = await this.deleteBoardsOwnedByUser(userId);
		// TODO: remove user references from boards

		const result = StepReportBuilder.build(this.moduleName, [boardsDeleted]);

		return result;
	}

	public async deleteBoardsOwnedByUser(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting boards owned by user',
				this.moduleName,
				userId,
				StepStatus.PENDING
			)
		);

		const mediaBoards = await this.mediaBoardService.findByExternalReference({
			type: BoardExternalReferenceType.User,
			id: userId,
		});

		await Promise.all(
			mediaBoards.map(async (mb) => {
				await this.boardNodeService.delete(mb);
			})
		);

		const numberOfDeletedBoards = mediaBoards.length;
		const boardIds = mediaBoards.map((mb) => mb.id);

		const result = StepOperationReportBuilder.build(StepOperationType.DELETE, numberOfDeletedBoards, boardIds);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted boards owned by user',
				this.moduleName,
				userId,
				StepStatus.FINISHED,
				0,
				numberOfDeletedBoards
			)
		);

		return result;
	}
}
