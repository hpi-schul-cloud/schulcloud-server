import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import {
	BoardExternalReference,
	Card,
	Column,
	ColumnBoard,
	ContentElementFactory,
	ContentElementType,
	EntityId,
	InputFormat,
	RichTextElement,
} from '@shared/domain';
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

	async getBoardObjectTitlesById(boardIds: EntityId[]): Promise<Record<EntityId, string>> {
		const titleMap = this.boardDoRepo.getTitleById(boardIds);
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
		});

		await this.boardDoRepo.save(columnBoard);

		return columnBoard;
	}

	async delete(board: ColumnBoard): Promise<void> {
		await this.boardDoService.deleteWithDescendants(board);
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

		await this.boardDoRepo.save(columnBoard);

		return columnBoard;
	}

	private createRichTextElement(text: string): RichTextElement {
		const element: RichTextElement = this.contentElementFactory.build(ContentElementType.RICH_TEXT) as RichTextElement;
		element.text = text;
		element.inputFormat = InputFormat.RICH_TEXT_CK5;

		return element;
	}
}
