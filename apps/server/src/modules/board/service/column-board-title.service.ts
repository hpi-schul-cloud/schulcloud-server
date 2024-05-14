import { Injectable } from '@nestjs/common';
import { CopyHelperService } from '@modules/copy-helper';
import { BoardExternalReference } from '../domain';
import { ColumnBoardService } from './column-board.service';

@Injectable()
export class ColumnBoardTitleService {
	constructor(
		private readonly columnBoardService: ColumnBoardService,
		private readonly copyHelperService: CopyHelperService
	) {}

	async deriveColumnBoardTitle(
		originalTitle: string,
		destinationExternalReference: BoardExternalReference
	): Promise<string> {
		const existingBoards = await this.columnBoardService.findByExternalReference(destinationExternalReference, 0);
		const existingTitles = existingBoards.map((board) => board.title);
		const copyName = this.copyHelperService.deriveCopyName(originalTitle, Object.values(existingTitles));

		return copyName;
	}
}
