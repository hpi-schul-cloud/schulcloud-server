import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import {
	Board,
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoardTarget,
	ContentElementType,
	EntityId,
	InputFormat,
} from '@shared/domain';
import { BoardRepo, LessonRepo } from '@shared/repo';
import { CardService, ColumnBoardService, ColumnService, ContentElementService } from '@src/modules/board';
import { RichTextContentBody } from '@src/modules/board/controller/dto';
import { TaskService } from '@src/modules/task/service';
import { ColumnBoardTargetService } from './column-board-target.service';

@Injectable()
export class RoomsService {
	constructor(
		private readonly taskService: TaskService,
		private readonly lessonRepo: LessonRepo,
		private readonly boardRepo: BoardRepo,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnService: ColumnService,
		private readonly cardService: CardService,
		private readonly contentElementService: ContentElementService,
		private readonly columnBoardTargetService: ColumnBoardTargetService
	) {}

	async updateBoard(board: Board, roomId: EntityId, userId: EntityId): Promise<Board> {
		const [courseLessons] = await this.lessonRepo.findAllByCourseIds([roomId]);
		const [courseTasks] = await this.taskService.findBySingleParent(userId, roomId);

		const courseColumnBoardTargets = await this.handleColumnBoardIntegration(roomId);

		const boardElementTargets = [...courseLessons, ...courseTasks, ...courseColumnBoardTargets];

		board.syncBoardElementReferences(boardElementTargets);

		await this.boardRepo.save(board);
		return board;
	}

	private async handleColumnBoardIntegration(roomId: EntityId): Promise<ColumnBoardTarget[]> {
		let courseColumnBoardTargets: ColumnBoardTarget[] = [];

		if ((Configuration.get('FEATURE_COLUMN_BOARD_ENABLED') as boolean) === true) {
			const courseReference = {
				type: BoardExternalReferenceType.Course,
				id: roomId,
			};

			const columnBoardIds = await this.columnBoardService.findIdsByExternalReference(courseReference);
			if (columnBoardIds.length === 0) {
				const columnBoard = await this.createWelcomeColumnBoard(courseReference);
				columnBoardIds.push(columnBoard.id);
			}

			courseColumnBoardTargets = await this.columnBoardTargetService.findOrCreateTargets(columnBoardIds);
		}
		return courseColumnBoardTargets;
	}

	private async createWelcomeColumnBoard(courseReference: BoardExternalReference) {
		const columnBoard = await this.columnBoardService.create(courseReference);
		const column = await this.columnService.create(columnBoard);
		const card = await this.cardService.create(column);
		await this.cardService.updateTitle(card, 'Willkommen auf dem neuen Spalten-Board! 🥳');

		const text1 = await this.contentElementService.create(card, ContentElementType.RICH_TEXT);
		const content1 = new RichTextContentBody();
		content1.inputFormat = InputFormat.RICH_TEXT_CK5;
		content1.text =
			'<p>Wir erweitern das Board kontinuierlich um wichtige Funktionen. <strong>Der aktuelle Stand kann hier getestet werden. </strong></p>';
		await this.contentElementService.update(text1, content1);

		if (Configuration.has('COLUMN_BOARD_HELP_LINK')) {
			const helplink = Configuration.get('COLUMN_BOARD_HELP_LINK') as string;
			const text2 = await this.contentElementService.create(card, ContentElementType.RICH_TEXT);
			const content2 = new RichTextContentBody();
			content2.inputFormat = InputFormat.RICH_TEXT_CK5;
			content2.text = `<p><strong> Wichtige Informationen</strong> zu Berechtigungen und Informationen zum Einsatz des Boards sind im <a href="${helplink}">Hilfebereich</a> zusammengefasst.</p>`;
			await this.contentElementService.update(text2, content2);
		}

		if (Configuration.has('COLUMN_BOARD_FEEDBACK_LINK')) {
			const feedbacklink = Configuration.get('COLUMN_BOARD_FEEDBACK_LINK') as string;
			const text3 = await this.contentElementService.create(card, ContentElementType.RICH_TEXT);
			const content3 = new RichTextContentBody();
			content3.inputFormat = InputFormat.RICH_TEXT_CK5;
			content3.text = `<p>Wir freuen uns sehr über <strong>Feedback</strong> zum Board unter <a href="${feedbacklink}">folgendem Link</a>.</p>`;
			await this.contentElementService.update(text3, content3);
		}
		return columnBoard;
	}
}
