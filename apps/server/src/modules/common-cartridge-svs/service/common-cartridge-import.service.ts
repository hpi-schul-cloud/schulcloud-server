import { CourseService } from '@modules/course';
import { ICurrentUser } from '@infra/auth-guard';
import { AuthorizationService } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { CourseEntity } from '@modules/course/repo';
import { BoardNodeFactory, BoardNodeService, Card, Column, ColumnBoard } from '@modules/board';
import { CommonCartridgeImportMappper } from '../mapper/common-cartridge-import.mapper';
import {
	CreateCcCourseBodyParams,
	CreateCcBoardBodyParams,
	CreateCcColumnBodyParams,
	CreateCcCardBodyParams,
} from '../contorller/common-cartridge-dtos';
import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@core/logger';
@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly authService: AuthorizationService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeFactory: BoardNodeFactory,
		private readonly mapper: CommonCartridgeImportMappper,
		private readonly logger: LegacyLogger
	) {}
	public async importCourse(commonCartridgeCourse: CreateCcCourseBodyParams, currentUser: ICurrentUser): Promise<void> {
		try {
			const user = await this.authService.getUserWithPermissions(currentUser.userId);

			this.logger.log(`Checking permissions for user ${currentUser.userId}, accountId: ${currentUser.accountId}`);

			this.authService.checkAllPermissions(user, [Permission.COURSE_CREATE]);
			const courseEntity = new CourseEntity({
				name: commonCartridgeCourse.name,
				color: commonCartridgeCourse.color,
				teachers: [user],
				school: user.school,
			});

			const savedCourse = await this.courseService.create(courseEntity);

			this.logger.log(`the following course was created: ${JSON.stringify(savedCourse)}`);

			// await this.importBoards(commonCartridgeCourse, savedCourse);
		} catch (error) {
			const err = error as Error;
			this.logger.error(`Error importing course: ${err.message}`);
			throw error;
		}
	}

	private async importBoards(
		commonCartridgeCourse: CreateCcCourseBodyParams,
		savedCourse: CourseEntity
	): Promise<void> {
		this.logger.log(`columnBoard to import are: ${commonCartridgeCourse.columnBoard?.length ?? 0}`);

		if (!commonCartridgeCourse.columnBoard || commonCartridgeCourse.columnBoard.length === 0) return;

		for (const board of commonCartridgeCourse.columnBoard) {
			const boardBodyParams = this.mapper.mapCommonCartridgeBoardToBoardBodyParams(board);
			const columnBoardToCreate = this.boardNodeFactory.buildColumnBoard({
				context: { type: boardBodyParams.parentType, id: savedCourse.id },
				title: boardBodyParams.title,
				layout: boardBodyParams.layout,
			});

			await this.boardNodeService.addRoot(columnBoardToCreate);
			await this.importColumns(board, columnBoardToCreate);
		}
	}

	private async importColumns(
		commonCartridgeBoard: CreateCcBoardBodyParams,
		createdColumnBoard: ColumnBoard
	): Promise<void> {
		if (!commonCartridgeBoard.columns || commonCartridgeBoard.columns.length === 0) return;

		for (const column of commonCartridgeBoard.columns) {
			const columnToCreate = this.boardNodeFactory.buildColumn();
			columnToCreate.title = column.title;
			await this.boardNodeService.addToParent(createdColumnBoard, columnToCreate);
			await this.importCards(column, columnToCreate);
		}
	}

	private async importCards(commonCartridgeColumns: CreateCcColumnBodyParams, createdColumn: Column): Promise<void> {
		if (!commonCartridgeColumns.cards || commonCartridgeColumns.cards.length === 0) return;

		for (const card of commonCartridgeColumns.cards) {
			const cardToCreate = this.boardNodeFactory.buildCard();
			cardToCreate.title = card.title;

			await this.boardNodeService.addToParent(createdColumn, cardToCreate);
			await this.importCardElements(card, cardToCreate);
		}
	}

	private async importCardElements(
		commCartridgeCardElements: CreateCcCardBodyParams,
		createdCard: Card
	): Promise<void> {
		if (!commCartridgeCardElements.cardElements || commCartridgeCardElements.cardElements.length === 0) return;

		for (const element of commCartridgeCardElements.cardElements) {
			const elementToCreate = this.boardNodeFactory.buildContentElement(
				this.mapper.mapCommonCartridgeElementType(element.type)
			);

			await this.boardNodeService.addToParent(createdCard, elementToCreate);

			const anyElementContent = this.mapper.mapCommonCartridgeCardElementToAnyElementContent(element);
			const content = this.mapper.mapContentToAnyElementContentBody(element);
			await this.boardNodeService.updateContent(anyElementContent, content);
		}
	}
}
