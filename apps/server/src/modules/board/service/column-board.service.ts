import { CopyElementType, CopyStatus, CopyHelperService } from '@modules/copy-helper';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	AnyBoardNode,
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoard,
	ColumnBoardProps,
	isColumnBoard,
} from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardNodeService } from './board-node.service';
import { ColumnBoardCopyService, ColumnBoardLinkService, CopyColumnBoardParams } from './internal';

@Injectable()
export class ColumnBoardService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly boardNodeService: BoardNodeService,
		private readonly columnBoardCopyService: ColumnBoardCopyService,
		private readonly columnBoardLinkService: ColumnBoardLinkService,
		private readonly copyHelperService: CopyHelperService
	) {}

	public async findById(id: EntityId, depth?: number): Promise<ColumnBoard> {
		const columnBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, id, depth);

		return columnBoard;
	}

	public async findByExternalReference(reference: BoardExternalReference, depth?: number): Promise<ColumnBoard[]> {
		const boardNodes: AnyBoardNode[] = await this.boardNodeRepo.findByExternalReference(reference, depth);

		const boards: ColumnBoard[] = boardNodes.filter((bn: AnyBoardNode): bn is ColumnBoard => isColumnBoard(bn));

		return boards;
	}

	public async updateVisibility(columnBoard: ColumnBoard, visibility: boolean): Promise<void> {
		await this.boardNodeService.updateVisibility(columnBoard, visibility);
	}

	public async updateReadersCanEdit(columnBoard: ColumnBoard, readersCanEdit: boolean): Promise<void> {
		columnBoard.readersCanEdit = readersCanEdit;
		await this.boardNodeRepo.save(columnBoard);
	}

	// @deprecated This is called from feathers. Should be removed when not needed anymore
	public async deleteByCourseId(courseId: EntityId): Promise<void> {
		await this.deleteByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: courseId,
		});
	}

	public async deleteByExternalReference(reference: BoardExternalReference): Promise<void> {
		const boardNodes = await this.findByExternalReference(reference);

		await Promise.all(boardNodes.map((boardNode) => this.boardNodeService.delete(boardNode)));
	}

	public async copyColumnBoard(params: CopyColumnBoardParams): Promise<CopyStatus> {
		const copyStatus = await this.columnBoardCopyService.copyColumnBoard(params);

		return copyStatus;
	}
	public async createColumnBoard(props: ColumnBoardProps): Promise<ColumnBoard> {
		const columnBoard = new ColumnBoard(props);

		await this.boardNodeRepo.save(columnBoard);

		return columnBoard;
	}

	public async swapLinkedIdsInBoards(copyStatus: CopyStatus, idMap?: Map<EntityId, EntityId>): Promise<CopyStatus> {
		if (!idMap) {
			idMap = new Map<EntityId, EntityId>();
		}
		const copyDict = this.copyHelperService.buildCopyEntityDict(copyStatus);
		copyDict.forEach((value, key) => idMap.set(key, value.id));

		const elements = copyStatus.elements ?? [];
		const updatedElements = await Promise.all(
			elements.map(async (el) => {
				if (el.type === CopyElementType.COLUMNBOARD && el.copyEntity) {
					el.copyEntity = await this.swapLinkedIds(el.copyEntity?.id, idMap);
				}
				return el;
			})
		);

		copyStatus.elements = updatedElements;
		return copyStatus;
	}

	public async swapLinkedIds(boardId: EntityId, idMap: Map<EntityId, EntityId>): Promise<ColumnBoard> {
		const board = await this.columnBoardLinkService.swapLinkedIds(boardId, idMap);

		return board;
	}
}
