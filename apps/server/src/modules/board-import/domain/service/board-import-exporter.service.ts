import {
	BoardLayout,
	BoardsClientAdapter,
	CardClientAdapter,
	ColumnClientAdapter,
	ContentElementType,
} from '@infra/common-cartridge-clients';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type EntityId, InputFormat } from '@shared/domain/types';
import { isAxiosError } from 'axios';
import { type BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import {
	type BoardImportCheckpoint,
	type BoardPlan,
	type PlannedCard,
	type PlannedColumn,
	type PlannedElement,
	PlannedElementType,
} from '../type';
import { BoardImportLinkPreviewService } from './board-import-link-preview.service';
import { type BoardImportUserSession } from './board-import-user-session';

const CONTENT_ELEMENT_TYPES: Record<PlannedElementType, ContentElementType> = {
	[PlannedElementType.TEXT]: ContentElementType.RICH_TEXT,
	[PlannedElementType.LINK]: ContentElementType.LINK,
};

// Creates the board of a board plan through the API of the board, and continues it from the checkpoints of the job.
// See ADR 0015 and ADR 0016.
@Injectable()
export class BoardImportExporterService {
	constructor(
		@Inject(BOARD_IMPORT_JOB_REPO) private readonly boardImportJobRepo: BoardImportJobRepo,
		private readonly boardsClient: BoardsClientAdapter,
		private readonly columnClient: ColumnClientAdapter,
		private readonly cardClient: CardClientAdapter,
		private readonly linkPreviewService: BoardImportLinkPreviewService
	) {}

	public async export(job: BoardImportJob, session: BoardImportUserSession, plan: BoardPlan): Promise<void> {
		const { boardId, checkpoints } = await this.findOrCreateBoard(job, session, plan);

		for (const [columnIndex, plannedColumn] of plan.columns.entries()) {
			const checkpoint = checkpoints.at(columnIndex);
			const columnId = checkpoint?.columnId ?? (await this.createColumn(job, boardId, plannedColumn, session));
			const cardsWithoutCheckpoint = plannedColumn.cards.slice(checkpoint?.cardIds.length ?? 0);

			for (const plannedCard of cardsWithoutCheckpoint) {
				await this.createCard(job, columnIndex, columnId, plannedCard, session);
			}
		}
	}

	private async createColumn(
		job: BoardImportJob,
		boardId: EntityId,
		plannedColumn: PlannedColumn,
		session: BoardImportUserSession
	): Promise<EntityId> {
		const column = await session.call((token) => this.boardsClient.createBoardColumn(token, boardId));
		if (plannedColumn.title !== '') {
			await session.call((token) =>
				this.columnClient.updateBoardColumnTitle(token, column.id, { title: plannedColumn.title })
			);
		}

		await this.boardImportJobRepo.addColumnCheckpoint(job.id, job.attempts, column.id);

		return column.id;
	}

	// The card is created with its empty elements, so each element needs no request to create it.
	private async createCard(
		job: BoardImportJob,
		columnIndex: number,
		columnId: EntityId,
		plannedCard: PlannedCard,
		session: BoardImportUserSession
	): Promise<void> {
		const requiredEmptyElements = plannedCard.elements.map((element) => CONTENT_ELEMENT_TYPES[element.type]);
		const card = await session.call((token) =>
			this.columnClient.createCard(token, columnId, { requiredEmptyElements })
		);
		if (plannedCard.title !== '') {
			await session.call((token) => this.cardClient.updateCardTitle(token, card.id, { title: plannedCard.title }));
		}

		for (const [index, plannedElement] of plannedCard.elements.entries()) {
			const elementId =
				card.elements.at(index)?.id ?? (await this.createElement(card.id, requiredEmptyElements[index], session));

			await this.writeElement(elementId, plannedElement, session);
		}

		await this.boardImportJobRepo.addCardCheckpoint(job.id, job.attempts, columnIndex, card.id);
	}

	private async createElement(
		cardId: EntityId,
		type: ContentElementType,
		session: BoardImportUserSession
	): Promise<EntityId> {
		const element = await session.call((token) => this.cardClient.createCardElement(token, cardId, { type }));

		return element.id;
	}

	private async writeElement(
		elementId: EntityId,
		plannedElement: PlannedElement,
		session: BoardImportUserSession
	): Promise<void> {
		const data =
			plannedElement.type === PlannedElementType.LINK
				? {
						type: ContentElementType.LINK,
						content: await this.linkPreviewService.buildLinkContent(elementId, plannedElement.url, session),
					}
				: {
						type: ContentElementType.RICH_TEXT,
						content: { text: plannedElement.html, inputFormat: InputFormat.RICH_TEXT_CK5 },
					};

		await session.call((token) => this.cardClient.updateCardElement(token, elementId, { data }));
	}

	private async findOrCreateBoard(
		job: BoardImportJob,
		session: BoardImportUserSession,
		plan: BoardPlan
	): Promise<{ boardId: EntityId; checkpoints: BoardImportCheckpoint[] }> {
		const { boardId: existingBoardId, checkpoints } = job;
		if (existingBoardId !== undefined) {
			if (await this.boardExists(existingBoardId, session)) {
				return { boardId: existingBoardId, checkpoints };
			}

			// The user can delete the board between two attempts. Then the job starts again with a new board.
			await this.boardImportJobRepo.resetBoard(job.id, job.attempts);
		}

		const boardId = await this.createBoard(job, session, plan);

		return { boardId, checkpoints: [] };
	}

	private async boardExists(boardId: EntityId, session: BoardImportUserSession): Promise<boolean> {
		try {
			await session.call((token) => this.boardsClient.getBoardSkeletonById(token, boardId));

			return true;
		} catch (error) {
			if (!this.isNotFound(error)) {
				throw error;
			}

			return false;
		}
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

		await this.boardImportJobRepo.setBoardId(job.id, job.attempts, board.id);

		return board.id;
	}
}
