import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';
import { BoardNode } from '@shared/domain/entity/boardnode/boardnode.entity';
import { Course } from '@shared/domain/entity/course.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { InputFormat } from '@shared/domain/types/input-format.types';
import { ConsoleWriterService } from '@shared/infra/console/console-writer/console-writer.service';
import { cardNodeFactory } from '@shared/testing/factory/boardnode/card-node.factory';
import { columnBoardNodeFactory } from '@shared/testing/factory/boardnode/column-board-node.factory';
import { columnNodeFactory } from '@shared/testing/factory/boardnode/column-node.factory';
import { richTextElementNodeFactory } from '@shared/testing/factory/boardnode/rich-text-element-node.factory';

@Injectable()
export class BoardManagementUc {
	constructor(private consoleWriter: ConsoleWriterService, private em: EntityManager) {}

	async createBoard(courseId: EntityId): Promise<EntityId | undefined> {
		if (!(await this.doesCourseExist(courseId))) {
			return undefined;
		}

		const context = { type: BoardExternalReferenceType.Course, id: courseId };
		const board = columnBoardNodeFactory.build({ context });
		await this.em.persistAndFlush(board);

		const columns = this.createColumns(3, board);
		await this.em.persistAndFlush(columns);

		const cardsPerColumn = columns.map((column) => this.createCards(this.random(1, 3), column));
		const cards = cardsPerColumn.flat();
		await this.em.persistAndFlush(cards);

		const elementsPerCard = cards.map((card) => this.createElements(1, card));
		const elements = elementsPerCard.flat();
		await this.em.persistAndFlush(elements);

		return board.id;
	}

	private createColumns(amount: number, parent: BoardNode): BoardNode[] {
		return this.generateArray(amount, (i) =>
			columnNodeFactory.build({
				parent,
				title: `Column ${i + 1}`,
				position: i,
			})
		);
	}

	private createCards(amount: number, parent: BoardNode): BoardNode[] {
		return this.generateArray(amount, (i) =>
			cardNodeFactory.build({
				parent,
				title: `Card ${i + 1}`,
				height: this.random(50, 250),
				position: i,
			})
		);
	}

	private createElements(amount: number, parent: BoardNode): BoardNode[] {
		return this.generateArray(amount, (i) =>
			richTextElementNodeFactory.build({
				parent,
				text: `<p><b>Text</b> ${i + 1}</p>`,
				inputFormat: InputFormat.RICH_TEXT_CK5,
				position: i,
			})
		);
	}

	private generateArray<T>(length: number, fn: (i: number) => T) {
		return [...Array(length).keys()].map((_, i) => fn(i));
	}

	private random(min: number, max: number): number {
		return Math.floor(Math.random() * (max + min - 1) + min);
	}

	private async doesCourseExist(courseId: EntityId = ''): Promise<boolean> {
		try {
			await this.em.findOneOrFail(Course, courseId);
			return true;
		} catch (err) {
			this.consoleWriter.info(`Error: course does not exist (courseId: "${courseId}")`);
		}
		return false;
	}
}
