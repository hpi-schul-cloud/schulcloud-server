import {
	BoardLayout,
	BoardsClientAdapter,
	CardClientAdapter,
	type CardResponse,
	ColumnClientAdapter,
	type ColumnResponse,
	ContentElementType,
} from '@infra/common-cartridge-clients';
import { Inject, Injectable } from '@nestjs/common';
import { type EntityId, InputFormat } from '@shared/domain/types';
import { escape } from 'lodash';
import { type BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { type BoardImportUserSession } from './board-import-user-session';

const BOARD_TITLE = 'Import';

// Placeholder for the import steps: one board with one column and one card that shows the link of the job.
@Injectable()
export class BoardImportPlaceholderBoardService {
	constructor(
		@Inject(BOARD_IMPORT_JOB_REPO) private readonly boardImportJobRepo: BoardImportJobRepo,
		private readonly boardsClient: BoardsClientAdapter,
		private readonly columnClient: ColumnClientAdapter,
		private readonly cardClient: CardClientAdapter
	) {}

	// Each part is created only if it does not exist, so a new attempt continues the board of the attempt before.
	public async write(job: BoardImportJob, session: BoardImportUserSession): Promise<void> {
		const boardId = job.boardId ?? (await this.createBoard(job, session));
		const columns = job.boardId ? await this.findColumns(boardId, session) : [];
		const column = columns[0] ?? (await session.call((token) => this.boardsClient.createBoardColumn(token, boardId)));
		const card = await this.findOrCreateCard(column, session);
		const elementId =
			card.elements[0]?.id ??
			(
				await session.call((token) =>
					this.cardClient.createCardElement(token, card.id, { type: ContentElementType.RICH_TEXT })
				)
			).id;

		const text = `<p>${escape(job.link)}</p>`;
		await session.call((token) =>
			this.cardClient.updateCardElement(token, elementId, {
				data: { type: ContentElementType.RICH_TEXT, content: { text, inputFormat: InputFormat.RICH_TEXT_CK5 } },
			})
		);
	}

	private async findColumns(boardId: EntityId, session: BoardImportUserSession): Promise<ColumnResponse[]> {
		const board = await session.call((token) => this.boardsClient.getBoardSkeletonById(token, boardId));

		return board.columns;
	}

	private async findOrCreateCard(column: ColumnResponse, session: BoardImportUserSession): Promise<CardResponse> {
		const cardId = column.cards[0]?.cardId;

		if (cardId === undefined) {
			const createdCard = await session.call((token) => this.columnClient.createCard(token, column.id, {}));

			return createdCard;
		}

		const cards = await session.call((token) => this.cardClient.getAllBoardCardsByIds(token, [cardId]));

		return cards.data[0];
	}

	private async createBoard(job: BoardImportJob, session: BoardImportUserSession): Promise<EntityId> {
		const board = await session.call((token) =>
			this.boardsClient.createBoard(token, {
				title: BOARD_TITLE,
				parentId: job.target.id,
				parentType: job.target.type,
				layout: BoardLayout.COLUMNS,
			})
		);

		await this.boardImportJobRepo.setBoardId(job.id, board.id);

		return board.id;
	}
}
