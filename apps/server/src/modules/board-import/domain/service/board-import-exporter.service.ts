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
import { type BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { type BoardPlan, type PlannedCard, type PlannedColumn } from '../type';
import { type BoardImportUserSession } from './board-import-user-session';

// Creates the board of a board plan through the API of the board. See ADR 0015.
// The columns, cards and elements are created in the order of the plan, and a part is created only if the board has
// no part at its position. Thus a new attempt continues the board of the attempt before.
@Injectable()
export class BoardImportExporterService {
	constructor(
		@Inject(BOARD_IMPORT_JOB_REPO) private readonly boardImportJobRepo: BoardImportJobRepo,
		private readonly boardsClient: BoardsClientAdapter,
		private readonly columnClient: ColumnClientAdapter,
		private readonly cardClient: CardClientAdapter
	) {}

	public async export(job: BoardImportJob, session: BoardImportUserSession, plan: BoardPlan): Promise<void> {
		const { boardId, columns } = await this.findOrCreateBoard(job, session, plan);

		for (const [index, plannedColumn] of plan.columns.entries()) {
			const column =
				columns[index] ?? (await session.call((token) => this.boardsClient.createBoardColumn(token, boardId)));

			await this.exportColumn(column, plannedColumn, session);
		}
	}

	private async exportColumn(
		column: ColumnResponse,
		plannedColumn: PlannedColumn,
		session: BoardImportUserSession
	): Promise<void> {
		if (column.title !== plannedColumn.title) {
			await session.call((token) =>
				this.columnClient.updateBoardColumnTitle(token, column.id, { title: plannedColumn.title })
			);
		}

		const cardsById = await this.findCards(column, session);

		for (const [index, plannedCard] of plannedColumn.cards.entries()) {
			const cardId = column.cards[index]?.cardId;
			const card =
				(cardId === undefined ? undefined : cardsById.get(cardId)) ??
				(await this.createCard(column.id, plannedCard, session));

			await this.exportCard(card, plannedCard, session);
		}
	}

	private async exportCard(
		card: CardResponse,
		plannedCard: PlannedCard,
		session: BoardImportUserSession
	): Promise<void> {
		if ((card.title ?? '') !== plannedCard.title) {
			await session.call((token) => this.cardClient.updateCardTitle(token, card.id, { title: plannedCard.title }));
		}

		for (const [index, plannedElement] of plannedCard.elements.entries()) {
			const elementId =
				card.elements[index]?.id ??
				(
					await session.call((token) =>
						this.cardClient.createCardElement(token, card.id, { type: ContentElementType.RICH_TEXT })
					)
				).id;

			await session.call((token) =>
				this.cardClient.updateCardElement(token, elementId, {
					data: {
						type: ContentElementType.RICH_TEXT,
						content: { text: plannedElement.html, inputFormat: InputFormat.RICH_TEXT_CK5 },
					},
				})
			);
		}
	}

	// The card is created with its empty elements, so each element needs only one more request.
	// All elements of the plan are text elements.
	private async createCard(
		columnId: EntityId,
		plannedCard: PlannedCard,
		session: BoardImportUserSession
	): Promise<CardResponse> {
		const requiredEmptyElements = plannedCard.elements.map(() => ContentElementType.RICH_TEXT);
		const card = await session.call((token) =>
			this.columnClient.createCard(token, columnId, { requiredEmptyElements })
		);

		return card;
	}

	// The list leaves out a card that does not exist anymore or that the user cannot read.
	private async findCards(
		column: ColumnResponse,
		session: BoardImportUserSession
	): Promise<Map<EntityId, CardResponse>> {
		const cardIds = column.cards.map((card) => card.cardId);
		if (cardIds.length === 0) {
			return new Map();
		}

		const cards = await session.call((token) => this.cardClient.getAllBoardCardsByIds(token, cardIds));
		const cardsById = new Map(cards.data.map((card) => [card.id, card]));

		return cardsById;
	}

	private async findOrCreateBoard(
		job: BoardImportJob,
		session: BoardImportUserSession,
		plan: BoardPlan
	): Promise<{ boardId: EntityId; columns: ColumnResponse[] }> {
		const existingBoard = await this.findBoard(job, session);
		if (existingBoard) {
			return existingBoard;
		}

		const boardId = await this.createBoard(job, session, plan);

		return { boardId, columns: [] };
	}

	// The user can delete the board between two attempts. Then the job starts again with a new board.
	private async findBoard(
		job: BoardImportJob,
		session: BoardImportUserSession
	): Promise<{ boardId: EntityId; columns: ColumnResponse[] } | undefined> {
		const { boardId } = job;
		if (boardId === undefined) {
			return undefined;
		}

		try {
			const board = await session.call((token) => this.boardsClient.getBoardSkeletonById(token, boardId));

			return { boardId, columns: board.columns };
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

	private async createBoard(job: BoardImportJob, session: BoardImportUserSession, plan: BoardPlan): Promise<EntityId> {
		const board = await session.call((token) =>
			this.boardsClient.createBoard(token, {
				title: plan.title,
				parentId: job.target.id,
				parentType: job.target.type,
				layout: BoardLayout.COLUMNS,
			})
		);

		await this.boardImportJobRepo.setBoardId(job.id, board.id);

		return board.id;
	}
}
