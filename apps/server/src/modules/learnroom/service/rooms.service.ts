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
		await this.cardService.updateTitle(card, 'Willkommen');
		const text = await this.contentElementService.create(card, ContentElementType.RICH_TEXT);
		const content = new RichTextContentBody();
		content.inputFormat = InputFormat.RICH_TEXT_CK5;
		content.text = '<p>Dieses Board ist ein neues Feature und kann hier getestet werden</p>';
		await this.contentElementService.update(text, content);
		return columnBoard;
	}
}
