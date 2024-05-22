import { Injectable } from '@nestjs/common';
import { CopyHelperService } from '@modules/copy-helper';
import { BoardExternalReference } from '../../domain';
import { ColumnBoardReferenceService } from './column-board-reference.service';

@Injectable()
export class ColumnBoardTitleService {
	constructor(
		private readonly columnBoardReferenceService: ColumnBoardReferenceService,
		private readonly copyHelperService: CopyHelperService
	) {}

	async deriveColumnBoardTitle(
		originalTitle: string,
		destinationExternalReference: BoardExternalReference
	): Promise<string> {
		const existingBoards = await this.columnBoardReferenceService.findByExternalReference(
			destinationExternalReference,
			0
		);
		const existingTitles = existingBoards.map((board) => board.title);
		const copyName = this.copyHelperService.deriveCopyName(originalTitle, Object.values(existingTitles));

		return copyName;
	}
}
