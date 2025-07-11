import { Logger } from '@core/logger';
import { StorageLocation } from '@infra/files-storage-client';
import { CopyElementType, CopyStatus, CopyHelperService } from '@modules/copy-helper';
import { RoomService } from '@modules/room';
import { ModuleName, SagaService, SagaStep } from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BoardExternalReferenceType, type ColumnBoard } from '../domain';
import { ColumnBoardService } from '../service';

@Injectable()
export class CopyRoomBoardsStep extends SagaStep<'copyRoomBoards'> {
	private readonly moduleName = ModuleName.BOARD;

	constructor(
		private readonly sagaService: SagaService,
		private readonly roomService: RoomService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly copyHelperService: CopyHelperService,
		private readonly logger: Logger
	) {
		super('copyRoomBoards');
		this.logger.setContext(CopyRoomBoardsStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: {
		userId: EntityId;
		sourceRoomId: EntityId;
		targetRoomId: EntityId;
	}): Promise<{ id: EntityId; title: string }[]> {
		const { userId, sourceRoomId, targetRoomId } = params;

		const boardsCopied = await this.copyRoomBoards(userId, sourceRoomId, targetRoomId);

		const result = boardsCopied.map((copyStatus) => {
			if (!copyStatus.copyEntity) {
				throw new Error('Copy status does not contain a copy entity');
			}
			return { id: copyStatus.copyEntity.id, title: (copyStatus.copyEntity as ColumnBoard).title };
		});

		return result;
	}

	private async copyRoomBoards(
		userId: EntityId,
		sourceRoomId: EntityId,
		targetRoomId: EntityId
	): Promise<CopyStatus[]> {
		const boards = await this.columnBoardService.findByExternalReference(
			{
				type: BoardExternalReferenceType.Room,
				id: sourceRoomId,
			},
			0
		);

		const sourceRoom = await this.roomService.getSingleRoom(sourceRoomId);
		const targetRoom = await this.roomService.getSingleRoom(targetRoomId);

		const copyStatuses: CopyStatus[] = [];
		for (const board of boards) {
			const copyStatus = await this.columnBoardService.copyColumnBoard({
				originalColumnBoardId: board.id,
				targetExternalReference: {
					type: BoardExternalReferenceType.Room,
					id: targetRoomId,
				},
				sourceStorageLocationReference: { id: sourceRoom.schoolId, type: StorageLocation.SCHOOL },
				targetStorageLocationReference: { id: targetRoom.schoolId, type: StorageLocation.SCHOOL },
				userId,
				targetSchoolId: targetRoom.schoolId,
				copyTitle: board.title,
			});
			copyStatuses.push(copyStatus);
		}

		const status: CopyStatus = {
			title: 'board',
			type: CopyElementType.ROOM,
			status: this.copyHelperService.deriveStatusFromElements(copyStatuses),
			copyEntity: targetRoom,
			originalEntity: sourceRoom,
			elements: copyStatuses,
		};

		await this.columnBoardService.swapLinkedIdsInBoards(status);

		return copyStatuses;
	}
}
