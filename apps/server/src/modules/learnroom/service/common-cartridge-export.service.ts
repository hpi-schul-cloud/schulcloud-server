import { CommonCartridgeVersion } from '@modules/common-cartridge';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType, Card, Column } from '@shared/domain/domainobject';
import { ComponentProperties } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ColumnBoardService } from '@src/modules/board';
import { CommonCartridgeExportFactory } from '@src/modules/common-cartridge/export/builders/common-cartridge-export.factory';
import { CommonCartridgeOrganizationNode as CommonCartridgeOrganizationBuilder } from '@src/modules/common-cartridge/export/builders/common-cartridge-organization-node';
import { createIdentifier } from '@src/modules/common-cartridge/export/utils';
import { CommonCartridgeMapper } from '../mapper/common-cartridge.mapper';
import { CourseService } from './course.service';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly commonCartridgeMapper: CommonCartridgeMapper
	) {}

	public async exportCourse(
		courseId: EntityId,
		userId: EntityId,
		version: CommonCartridgeVersion,
		exportedTopics: string[],
		exportedTasks: string[]
	): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const builder = new CommonCartridgeExportFactory(this.commonCartridgeMapper.mapCourseToManifest(version, course));

		builder.addMetadata(this.commonCartridgeMapper.mapCourseToMetadata(course));

		await this.addLessons(builder, courseId, version, exportedTopics);
		await this.addTasks(builder, courseId, userId, version, exportedTasks);
		await this.addColumnBoards(builder, courseId);

		return builder.build();
	}

	private async addLessons(
		builder: CommonCartridgeExportFactory,
		courseId: EntityId,
		version: CommonCartridgeVersion,
		topics: string[]
	): Promise<void> {
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);

		lessons.forEach((lesson) => {
			if (!topics.includes(lesson.id)) {
				return;
			}

			const lessonOrganization = builder.createOrganization({
				identifier: createIdentifier(lesson.id),
				title: lesson.name,
			});

			lesson.contents.forEach((content) => {
				this.addComponentToOrganization(lessonOrganization, content);
			});

			lesson.getLessonLinkedTasks().forEach((task) => {
				lessonOrganization.addResource(this.commonCartridgeMapper.mapTaskToResource(task, version));
			});
		});
	}

	private async addTasks(
		builder: CommonCartridgeExportFactory,
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

			tasksOrganization.addResource(this.commonCartridgeMapper.mapTaskToResource(task, version));
		});
	}

	private async addColumnBoards(builder: CommonCartridgeExportFactory, courseId: EntityId): Promise<void> {
		const columnBoardIds = await this.columnBoardService.findIdsByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: courseId,
		});

		for await (const columnBoardId of columnBoardIds) {
			const columnBoard = await this.columnBoardService.findById(columnBoardId);

			const organization = builder.createOrganization({
				title: columnBoard.title,
				identifier: createIdentifier(columnBoard.id),
			});

			columnBoard.children
				.filter((child) => child instanceof Column)
				.forEach((column) => this.addColumnToOrganization(column as Column, builder, organization));
		}
	}

	private addColumnToOrganization(
		column: Column,
		builder: CommonCartridgeExportFactory,
		organizationBuilder: CommonCartridgeOrganizationBuilder
	): void {
		const { id } = column;
		const columnOrganization = organizationBuilder.createChild({
			title: column.title,
			identifier: createIdentifier(id),
		});

		column.children
			.filter((child) => child instanceof Card)
			.forEach((card) => this.addCardToOrganization(card as Card, columnOrganization));
	}

	private addCardToOrganization(card: Card, cardOrganization: CommonCartridgeOrganizationBuilder): void {
		const { id } = card;
		cardOrganization.createChild({
			title: card.title,
			identifier: createIdentifier(id),
		});
	}

	private addComponentToOrganization(
		lessonOrganization: CommonCartridgeOrganizationBuilder,
		component: ComponentProperties
	): void {
		const resources = this.commonCartridgeMapper.mapContentToResources(component);

		if (Array.isArray(resources)) {
			const componentOrganization = lessonOrganization.createChild(
				this.commonCartridgeMapper.mapContentToOrganization(component)
			);

			resources.forEach((resource) => {
				componentOrganization.addResource(resource);
			});
		} else {
			lessonOrganization.addResource(resources);
		}
	}
}
