import {
	BoardLayout,
	BoardsClientAdapter,
	CardClientAdapter,
	type CardResponse,
	ColumnClientAdapter,
	type ColumnResponse,
	ContentElementType,
} from '@infra/common-cartridge-clients';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type EntityId, InputFormat } from '@shared/domain/types';
import { isAxiosError } from 'axios';
import { escape } from 'lodash';
import { type BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { type BoardImportUserSession } from './board-import-user-session';

const BOARD_TITLE = 'Import';

// Only the start of the answer is shown, as a proof that the worker did read the source.
const SOURCE_RESPONSE_MAX_LENGTH = 2000;
const HIGH_SURROGATE_AT_END = /[\uD800-\uDBFF]$/;

// Placeholder for the import steps: one board with one column and two cards. The first card shows the link of the job,
// the second card shows the start of the answer of the source.
@Injectable()
export class BoardImportPlaceholderBoardService {
	constructor(
		@Inject(BOARD_IMPORT_JOB_REPO) private readonly boardImportJobRepo: BoardImportJobRepo,
		private readonly boardsClient: BoardsClientAdapter,
		private readonly columnClient: ColumnClientAdapter,
		private readonly cardClient: CardClientAdapter
	) {}

	// Each part is created only if it does not exist, so a new attempt continues the board of the attempt before.
	public async write(job: BoardImportJob, session: BoardImportUserSession, sourceResponse: string): Promise<void> {
		const { boardId, columns } = await this.findOrCreateBoard(job, session);
		const column = columns[0] ?? (await session.call((token) => this.boardsClient.createBoardColumn(token, boardId)));
		const sourceResponseStart = sourceResponse.slice(0, SOURCE_RESPONSE_MAX_LENGTH).replace(HIGH_SURROGATE_AT_END, '');

		await this.writeTextCard(column, 0, job.source.link, session);
		await this.writeTextCard(column, 1, sourceResponseStart, session);
	}

	// The text is escaped, so the server stores it as plain text and its sanitizer does not change it.
	private async writeTextCard(
		column: ColumnResponse,
		index: number,
		plainText: string,
		session: BoardImportUserSession
	): Promise<void> {
		const card = await this.findOrCreateCard(column, index, session);
		const textElement = card.elements.find((element) => element.type === ContentElementType.RICH_TEXT);
		const elementId =
			textElement?.id ??
			(
				await session.call((token) =>
					this.cardClient.createCardElement(token, card.id, { type: ContentElementType.RICH_TEXT })
				)
			).id;

		const text = `<p>${escape(plainText)}</p>`;
		await session.call((token) =>
			this.cardClient.updateCardElement(token, elementId, {
				data: { type: ContentElementType.RICH_TEXT, content: { text, inputFormat: InputFormat.RICH_TEXT_CK5 } },
			})
		);
	}

	private async findOrCreateBoard(
		job: BoardImportJob,
		session: BoardImportUserSession
	): Promise<{ boardId: EntityId; columns: ColumnResponse[] }> {
		if (job.boardId) {
			const columns = await this.findColumns(job, job.boardId, session);
			if (columns) {
				return { boardId: job.boardId, columns };
			}
		}

		const boardId = await this.createBoard(job, session);

		return { boardId, columns: [] };
	}

	// The user can delete the board between two attempts. Then the job starts again with a new board.
	private async findColumns(
		job: BoardImportJob,
		boardId: EntityId,
		session: BoardImportUserSession
	): Promise<ColumnResponse[] | undefined> {
		try {
			const board = await session.call((token) => this.boardsClient.getBoardSkeletonById(token, boardId));

			return board.columns;
		} catch (error) {
			if (!this.isNotFound(error)) {
				throw error;
			}
		}

		await this.boardImportJobRepo.removeBoardId(job.id);

		return undefined;
	}

	private isNotFound(error: unknown): boolean {
		const isNotFound = isAxiosError(error) && error.response?.status === HttpStatus.NOT_FOUND;

		return isNotFound;
	}

	private async findOrCreateCard(
		column: ColumnResponse,
		index: number,
		session: BoardImportUserSession
	): Promise<CardResponse> {
		const existingCard = await this.findCard(column, index, session);
		const card = existingCard ?? (await session.call((token) => this.columnClient.createCard(token, column.id, {})));

		return card;
	}

	private async findCard(
		column: ColumnResponse,
		index: number,
		session: BoardImportUserSession
	): Promise<CardResponse | undefined> {
		const cardId = column.cards[index]?.cardId;

		if (cardId === undefined) {
			return undefined;
		}

		// The list leaves out a card that does not exist anymore or that the user cannot read.
		const cards = await session.call((token) => this.cardClient.getAllBoardCardsByIds(token, [cardId]));
		const card = cards.data.at(0);

		return card;
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
