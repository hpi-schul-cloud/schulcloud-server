import { CopyElementType, CopyHelperService, CopyStatus } from '@modules/copy-helper';
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
import {
	BoardCopyService,
	ColumnBoardLinkService,
	CopyCardParams,
	CopyColumnBoardParams,
	CopyColumnParams,
} from './internal';

@Injectable()
export class ColumnBoardService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardCopyService: BoardCopyService,
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
		const copyStatus = await this.boardCopyService.copyColumnBoard(params);

		return copyStatus;
	}

	public async createColumnBoard(props: ColumnBoardProps): Promise<ColumnBoard> {
		const columnBoard = new ColumnBoard(props);

		await this.boardNodeRepo.save(columnBoard);

		return columnBoard;
	}

	public async copyCard(params: CopyCardParams): Promise<CopyStatus> {
		const copyStatus = await this.boardCopyService.copyCard(params);

		return copyStatus;
	}

	public async copyColumn(params: CopyColumnParams): Promise<CopyStatus> {
		const copyStatus = await this.boardCopyService.copyColumn(params);

		return copyStatus;
	}

	public async swapLinkedIdsInCopy(copyStatus: CopyStatus, idMap?: Map<EntityId, EntityId>): Promise<CopyStatus> {
		idMap ??= new Map<EntityId, EntityId>();
		const copyDict = this.copyHelperService.buildCopyEntityDict(copyStatus);
		copyDict.forEach((value, key) => idMap.set(key, value.id));

		const swappableBoardNodeTypes = new Set([CopyElementType.COLUMNBOARD, CopyElementType.COLUMN]);

		if (swappableBoardNodeTypes.has(copyStatus.type) && copyStatus.copyEntity) {
			copyStatus.copyEntity = await this.swapLinkedIdsInBoardNode(copyStatus.copyEntity.id, idMap);
		}

		const updatedElements = await Promise.all(
			(copyStatus.elements ?? []).map(async (el) => {
				if (swappableBoardNodeTypes.has(el.type) && el.copyEntity) {
					el.copyEntity = await this.swapLinkedIdsInBoardNode(el.copyEntity.id, idMap);
				}
				return el;
			})
		);

		copyStatus.elements = updatedElements;
		return copyStatus;
	}

	public swapLinkedIdsInBoardNode(nodeId: EntityId, idMap: Map<EntityId, EntityId>): Promise<AnyBoardNode> {
		return this.columnBoardLinkService.swapLinkedIdsInBoardNode(nodeId, idMap);
	}
}
