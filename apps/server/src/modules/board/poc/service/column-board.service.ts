import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BoardExternalReference, BoardExternalReferenceType, ColumnBoard, isColumnBoard } from '../domain';
import { BoardNodeRepo } from '../repo';

@Injectable()
export class ColumnBoardService {
	constructor(private readonly boardNodeRepo: BoardNodeRepo) {}

	async findByExternalReference(reference: BoardExternalReference, depth?: number): Promise<ColumnBoard[]> {
		const boardNodes = await this.boardNodeRepo.findByExternalReference(reference, depth);

		const boards = boardNodes.filter((bn) => isColumnBoard(bn));

		return boards as ColumnBoard[];
	}

	// called from feathers
	// TODO remove when not needed anymore
	async deleteByCourseId(courseId: EntityId): Promise<void> {
		const boardNodes = await this.findByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: courseId,
		});

		await this.boardNodeRepo.removeAndFlush(boardNodes);
	}
}
