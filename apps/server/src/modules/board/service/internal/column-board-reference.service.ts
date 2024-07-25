import { Injectable } from '@nestjs/common';
import { BoardExternalReference, ColumnBoard, isColumnBoard } from '../../domain';
import { BoardNodeRepo } from '../../repo';

@Injectable()
export class ColumnBoardReferenceService {
	constructor(private readonly boardNodeRepo: BoardNodeRepo) {}

	async findByExternalReference(reference: BoardExternalReference, depth?: number): Promise<ColumnBoard[]> {
		const boardNodes = await this.boardNodeRepo.findByExternalReference(reference, depth);

		const boards = boardNodes.filter((bn) => isColumnBoard(bn));

		return boards;
	}
}
