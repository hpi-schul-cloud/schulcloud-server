import {
	CommonCartridgeFileBuilder,
	CommonCartridgeOrganizationBuilder,
	CommonCartridgeVersion,
} from '@modules/common-cartridge';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { ComponentProperties } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ColumnBoardService } from '@src/modules/board';
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
		const builder = new CommonCartridgeFileBuilder(this.commonCartridgeMapper.mapCourseToManifest(version, course));

		builder.addMetadata(this.commonCartridgeMapper.mapCourseToMetadata(course));

		await this.addLessons(builder, courseId, version, exportedTopics);
		await this.addTasks(builder, courseId, userId, version, exportedTasks);
		await this.addColumnBoards(builder, courseId);

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

			const organizationBuilder = builder.addOrganization(this.commonCartridgeMapper.mapLessonToOrganization(lesson));

			lesson.contents.forEach((content) => {
				this.addComponentToOrganization(organizationBuilder, content);
			});

			lesson.getLessonLinkedTasks().forEach((task) => {
				organizationBuilder.addResource(this.commonCartridgeMapper.mapTaskToResource(task, version));
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

		const organization = builder.addOrganization({
			title: '',
			identifier: createIdentifier(),
		});

		tasks.forEach((task) => {
			if (!exportedTasks.includes(task.id)) {
				return;
			}

			organization.addResource(this.commonCartridgeMapper.mapTaskToResource(task, version));
		});
	}

	private async addColumnBoards(builder: CommonCartridgeFileBuilder, courseId: EntityId): Promise<void> {
		const columnBoardIds = await this.columnBoardService.findIdsByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: courseId,
		});

		for await (const columnBoardId of columnBoardIds) {
			const columnBoard = await this.columnBoardService.findById(columnBoardId);

			builder.addOrganization({
				title: columnBoard.title,
				identifier: createIdentifier(columnBoard.id),
			});
		}
	}

	private addComponentToOrganization(
		organizationBuilder: CommonCartridgeOrganizationBuilder,
		component: ComponentProperties
	): void {
		const resources = this.commonCartridgeMapper.mapContentToResources(component);

		if (Array.isArray(resources)) {
			const subOrganizationBuilder = organizationBuilder.addSubOrganization(
				this.commonCartridgeMapper.mapContentToOrganization(component)
			);

			resources.forEach((resource) => {
				subOrganizationBuilder.addResource(resource);
			});
		} else {
			organizationBuilder.addResource(resources);
		}
	}
}
