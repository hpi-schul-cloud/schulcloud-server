import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SagaRegistryService, SagaStepRegistryService } from '../service';
import { ModuleName, Saga } from '../type';

@Injectable()
export class RoomCopySaga extends Saga<'roomCopy'> {
	constructor(
		private readonly stepRegistry: SagaStepRegistryService,
		private readonly sagaRegistry: SagaRegistryService
	) {
		super('roomCopy');
		this.sagaRegistry.registerSaga(this);
	}

	public async execute(params: {
		userId: EntityId;
		roomId: EntityId;
		newName?: string;
	}): Promise<{ roomCopied: { id: EntityId; name: string }; boardsCopied: { id: EntityId; title: string }[] }> {
		const { userId, roomId, newName } = params;

		this.stepRegistry.checkStep(ModuleName.ROOM, 'copyRoom');
		this.stepRegistry.checkStep(ModuleName.BOARD, 'copyRoomBoards');

		const copyRoomResult = await this.stepRegistry.executeStep(ModuleName.ROOM, 'copyRoom', {
			userId,
			roomId,
			newName,
		});

		const copyRoomBoardsResult = await this.stepRegistry.executeStep(ModuleName.BOARD, 'copyRoomBoards', {
			userId,
			sourceRoomId: roomId,
			targetRoomId: copyRoomResult.id,
		});

		const boardMappings = new Map<EntityId, EntityId>();
		for (const board of copyRoomBoardsResult) {
			boardMappings.set(board.originalId, board.copyId);
		}

		await this.stepRegistry.executeStep(ModuleName.ROOM, 'copyRoomContent', {
			sourceRoomId: roomId,
			targetRoomId: copyRoomResult.id,
			boardMappings,
		});

		const result = { roomCopied: copyRoomResult, boardsCopied: copyRoomBoardsResult };

		return result;
	}
}
