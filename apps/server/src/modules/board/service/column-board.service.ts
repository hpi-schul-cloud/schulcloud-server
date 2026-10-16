import { CopyHelperService, CopyStatus } from '@modules/copy-helper';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	AnyBoardNode,
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoard,
	ColumnBoardProps,
	isAnyBoardNode,
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

	public findExternalReferenceIds(reference: BoardExternalReference): Promise<EntityId[]> {
		return this.boardNodeRepo.findIdsByExternalReference(reference);
	}

	public findExternalReferenceIdsByReferences(
		references: BoardExternalReference[]
	): Promise<Map<EntityId, EntityId[]>> {
		if (references.length === 0) {
			return Promise.resolve(new Map());
		}

		return this.boardNodeRepo.findIdsByExternalReferences(references);
	}

	public async findExternalReferenceIdsByContextExternalToolIds(
		contextExternalToolIds: EntityId[],
		referenceType: BoardExternalReferenceType
	): Promise<EntityId[]> {
		if (contextExternalToolIds.length === 0) {
			return [];
		}

		// Depth 0 avoids loading descendants; we only need root board/context information.
		const toolNodes = await this.boardNodeRepo.findByContextExternalToolIds(contextExternalToolIds, 0);
		const rootBoardIds = Array.from(new Set(toolNodes.map((node) => node.rootId)));

		if (rootBoardIds.length === 0) {
			return [];
		}

		const rootNodes = await this.boardNodeRepo.findByIds(rootBoardIds, 0);
		const references = rootNodes
			.filter((node): node is ColumnBoard => isColumnBoard(node))
			.map((board) => board.context)
			.filter((context) => context.type === referenceType)
			.map((context) => context.id);

		return Array.from(new Set(references));
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

	public async updateIdsInLinks(
		copyStatus: CopyStatus,
		replacementMap: Record<string, string> = {}
	): Promise<CopyStatus> {
		if (copyStatus.copyEntity === undefined) {
			return copyStatus;
		}

		Object.assign(replacementMap, this.copyHelperService.buildReplacementMap(copyStatus));

		if (isAnyBoardNode(copyStatus.copyEntity)) {
			copyStatus.copyEntity = await this.columnBoardLinkService.rewriteLinkUrlsInBoardNode(
				copyStatus.copyEntity,
				replacementMap
			);
			return copyStatus;
		} else {
			const promises = copyStatus.elements?.map((element) => this.updateIdsInLinks(element, replacementMap)) ?? [];

			copyStatus.elements = await Promise.all(promises);
		}

		return copyStatus;
	}

	public async findByExternalReferences(
		references: BoardExternalReference[],
		depth?: number
	): Promise<Map<EntityId, ColumnBoard[]>> {
		const boardMap = await this.boardNodeRepo.findByExternalReferences(references, depth);
		const result = new Map<EntityId, ColumnBoard[]>();

		for (const reference of references) {
			result.set(
				reference.id,
				(boardMap.get(reference.id) ?? []).filter((boardNode): boardNode is ColumnBoard => isColumnBoard(boardNode))
			);
		}

		return result;
	}
}
