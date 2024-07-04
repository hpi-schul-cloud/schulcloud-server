import {
	AnyBoardNode,
	BoardExternalReferenceType,
	Card,
	Column,
	ColumnBoardService,
	isCard,
	isColumn,
	isLinkElement,
	isRichTextElement,
} from '@modules/board';
import {
	CommonCartridgeFileBuilder,
	CommonCartridgeOrganizationNode,
	CommonCartridgeVersion,
	createIdentifier,
} from '@modules/common-cartridge';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { ComponentProperties } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { CommonCartridgeExportMapper } from '../mapper/common-cartridge-export.mapper';
import { CourseService } from './course.service';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly mapper: CommonCartridgeExportMapper
	) {}

	public async exportCourse(
		courseId: EntityId,
		userId: EntityId,
		version: CommonCartridgeVersion,
		exportedTopics: string[],
		exportedTasks: string[],
		exportedColumnBoards: string[]
	): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const builder = new CommonCartridgeFileBuilder(this.mapper.mapCourseToManifest(version, course));

		builder.addMetadata(this.mapper.mapCourseToMetadata(course));

		await this.addLessons(builder, courseId, version, exportedTopics);
		await this.addTasks(builder, courseId, userId, version, exportedTasks);
		await this.addColumnBoards(builder, courseId, exportedColumnBoards);

		return builder.build();
	}

	private async addLessons(
		builder: CommonCartridgeFileBuilder,
		courseId: EntityId,
		version: CommonCartridgeVersion,
		topics: string[]
	): Promise<void> {
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);

		lessons.forEach((lesson) => {
			if (!topics.includes(lesson.id)) {
				return;
			}

			const lessonOrganization = builder.createOrganization(this.mapper.mapLessonToOrganization(lesson));

			lesson.contents.forEach((content) => {
				this.addComponentToOrganization(content, lessonOrganization);
			});

			lesson.getLessonLinkedTasks().forEach((task) => {
				lessonOrganization.addResource(this.mapper.mapTaskToResource(task, version));
			});
		});
	}

	private async addTasks(
		builder: CommonCartridgeFileBuilder,
		courseId: EntityId,
		userId: EntityId,
		version: CommonCartridgeVersion,
		exportedTasks: string[]
	): Promise<void> {
		const [tasks] = await this.taskService.findBySingleParent(userId, courseId);

		if (tasks.length === 0) {
			return;
		}

		const tasksOrganization = builder.createOrganization({
			title: 'Aufgaben',
			identifier: createIdentifier(),
		});

		tasks.forEach((task) => {
			if (!exportedTasks.includes(task.id)) {
				return;
			}

			tasksOrganization.addResource(this.mapper.mapTaskToResource(task, version));
		});
	}

	private async addColumnBoards(
		builder: CommonCartridgeFileBuilder,
		courseId: EntityId,
		exportedColumnBoards: string[]
	): Promise<void> {
		const columnBoards = (
			await this.columnBoardService.findByExternalReference({
				type: BoardExternalReferenceType.Course,
				id: courseId,
			})
		).filter((cb) => exportedColumnBoards.includes(cb.id));

		for (const columnBoard of columnBoards) {
			const columnBoardOrganization = builder.createOrganization({
				title: columnBoard.title,
				identifier: createIdentifier(columnBoard.id),
			});

			columnBoard.children
				.filter((child) => isColumn(child))
				.forEach((column) => this.addColumnToOrganization(column as Column, columnBoardOrganization));
		}
	}

	private addColumnToOrganization(column: Column, columnBoardOrganization: CommonCartridgeOrganizationNode): void {
		const { id } = column;
		const columnOrganization = columnBoardOrganization.createChild({
			title: column.title || '',
			identifier: createIdentifier(id),
		});

		column.children
			.filter((child) => isCard(child))
			.forEach((card) => this.addCardToOrganization(card as Card, columnOrganization));
	}

	private addCardToOrganization(card: Card, columnOrganization: CommonCartridgeOrganizationNode): void {
		const cardOrganization = columnOrganization.createChild({
			title: card.title || '',
			identifier: createIdentifier(card.id),
		});

		card.children.forEach((child) => this.addCardElementToOrganization(child, cardOrganization));
	}

	private addCardElementToOrganization(element: AnyBoardNode, cardOrganization: CommonCartridgeOrganizationNode): void {
		if (isRichTextElement(element)) {
			const resource = this.mapper.mapRichTextElementToResource(element);

			cardOrganization.addResource(resource);
		}

		if (isLinkElement(element)) {
			const resource = this.mapper.mapLinkElementToResource(element);

			cardOrganization.addResource(resource);
		}
	}

	private addComponentToOrganization(
		component: ComponentProperties,
		lessonOrganization: CommonCartridgeOrganizationNode
	): void {
		const resources = this.mapper.mapContentToResources(component);

		if (Array.isArray(resources)) {
			const componentOrganization = lessonOrganization.createChild(this.mapper.mapContentToOrganization(component));

			resources.forEach((resource) => {
				componentOrganization.addResource(resource);
			});
		} else {
			lessonOrganization.addResource(resources);
		}
	}
}
