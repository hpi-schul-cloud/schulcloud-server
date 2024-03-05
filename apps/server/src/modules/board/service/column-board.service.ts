import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import {
	AnyBoardDo,
	BoardExternalReference,
	BoardExternalReferenceType,
	Card,
	Column,
	ColumnBoard,
	ContentElementFactory,
	ContentElementType,
	RichTextElement,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ColumnBoardService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentElementFactory: ContentElementFactory
	) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.boardDoRepo.findByClassAndId(ColumnBoard, boardId);

		return board;
	}

	async findIdsByExternalReference(reference: BoardExternalReference): Promise<EntityId[]> {
		const ids = this.boardDoRepo.findIdsByExternalReference(reference);

		return ids;
	}

	async findByDescendant(boardDo: AnyBoardDo): Promise<ColumnBoard> {
		const rootboardDo = this.boardDoService.getRootBoardDo(boardDo);

		return rootboardDo;
	}

	async getBoardObjectTitlesById(boardIds: EntityId[]): Promise<Record<EntityId, string>> {
		const titleMap = this.boardDoRepo.getTitlesByIds(boardIds);
		return titleMap;
	}

	async create(context: BoardExternalReference, title = ''): Promise<ColumnBoard> {
		const columnBoard = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context,
			isVisible: false,
		});

		await this.boardDoRepo.save(columnBoard);

		return columnBoard;
	}

	async delete(board: ColumnBoard): Promise<void> {
		await this.boardDoService.deleteWithDescendants(board);
	}

	async deleteByCourseId(courseId: EntityId): Promise<void> {
		const columnBoardsId = await this.findIdsByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: courseId,
		});

		const deletePromises = columnBoardsId.map((columnBoardId) => this.deleteColumnBoardById(columnBoardId));

		await Promise.all(deletePromises);
	}

	private async deleteColumnBoardById(id: EntityId): Promise<void> {
		const columnBoardToDeletion = await this.boardDoRepo.findByClassAndId(ColumnBoard, id);

		if (columnBoardToDeletion) {
			await this.boardDoService.deleteWithDescendants(columnBoardToDeletion);
		}
	}

	async updateTitle(board: ColumnBoard, title: string): Promise<void> {
		board.title = title;
		await this.boardDoRepo.save(board);
	}

	async createWelcomeColumnBoard(courseReference: BoardExternalReference) {
		const columnBoard = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context: courseReference,
			isVisible: true,
		});

		const column = new Column({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		columnBoard.addChild(column);

		const card = new Card({
			id: new ObjectId().toHexString(),
			title: 'Willkommen auf dem neuen Spalten-Board! 🥳',
			height: 150,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		column.addChild(card);

		const text1 = this.createRichTextElement(
			'<p>Wir erweitern das Board kontinuierlich um wichtige Funktionen. <strong>Der aktuelle Stand kann hier getestet werden. </strong></p>'
		);
		card.addChild(text1);

		if (Configuration.has('COLUMN_BOARD_HELP_LINK')) {
			const helplink = Configuration.get('COLUMN_BOARD_HELP_LINK') as string;
			const text2 = this.createRichTextElement(
				`<p><strong> Wichtige Informationen</strong> zu Berechtigungen und Informationen zum Einsatz des Boards sind im <a href="${helplink}">Hilfebereich</a> zusammengefasst.</p>`
			);
			card.addChild(text2);
		}

		if (Configuration.has('COLUMN_BOARD_FEEDBACK_LINK')) {
			const feedbacklink = Configuration.get('COLUMN_BOARD_FEEDBACK_LINK') as string;
			const text3 = this.createRichTextElement(
				`<p>Wir freuen uns sehr über <strong>Feedback</strong> zum Board unter <a href="${feedbacklink}">folgendem Link</a>.</p>`
			);
			card.addChild(text3);
		}

		const SC_THEME = Configuration.get('SC_THEME') as string;
		if (SC_THEME !== 'default') {
			const clientUrl = Configuration.get('HOST') as string;
			const text4 = this.createRichTextElement(
				`<p>Wir freuen uns über <a href="${clientUrl}/help/contact/">Feedback und Wünsche</a>.</p>`
			);
			card.addChild(text4);
		}

		await this.boardDoRepo.save(columnBoard);

		return columnBoard;
	}

	private createRichTextElement(text: string): RichTextElement {
		const element: RichTextElement = this.contentElementFactory.build(ContentElementType.RICH_TEXT) as RichTextElement;
		element.text = text;

		return element;
	}

	async updateBoardVisibility(id: EntityId, isVisible: boolean): Promise<void> {
		const boardDo = await this.boardDoRepo.findById(id, 1);
		const rootBoardDo = await this.boardDoService.getRootBoardDo(boardDo);

		rootBoardDo.isVisible = isVisible;
		await this.boardDoRepo.save(rootBoardDo);
	}
}
