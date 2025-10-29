import { Logger } from '@core/logger';
import { ModuleName, SagaService, SagaStep } from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomBoardService } from '../service';

@Injectable()
export class CopyRoomContentStep extends SagaStep<'copyRoomContent'> {
	private readonly moduleName = ModuleName.ROOM;

	constructor(
		private readonly sagaService: SagaService,
		private readonly roomBoardService: RoomBoardService,

		private readonly logger: Logger
	) {
		super('copyRoomContent');
		this.logger.setContext(CopyRoomContentStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: {
		sourceRoomId: EntityId;
		targetRoomId: EntityId;
		boardMappings: Map<EntityId, EntityId>;
	}): Promise<void> {
		const { sourceRoomId, targetRoomId, boardMappings } = params;

		await this.roomBoardService.copyRoomContent(sourceRoomId, targetRoomId, boardMappings);
	}
}
