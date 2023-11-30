import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { CommonCartridgeFileBuilder, CommonCartridgeVersion } from '../common-cartridge';
import { CommonCartridgeMapper } from '../mapper/common-cartridge.mapper';
import { CourseService } from './course.service';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId, version: CommonCartridgeVersion): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const builder = new CommonCartridgeFileBuilder({
			identifier: courseId,
			version,
		});

		builder.addMetadata(CommonCartridgeMapper.mapCourseToMetadata(course));

		await this.addLessons(builder, version, courseId);
		await this.addTasks(builder, version, courseId, userId);

		return builder.build();
	}

	private async addLessons(
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		courseId: EntityId
	): Promise<void> {
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);

		lessons.forEach((lesson) => {
			const organizationBuilder = builder.addOrganization(CommonCartridgeMapper.mapLessonToOrganization(lesson));

			lesson.contents.forEach((content) => {
				const resources = CommonCartridgeMapper.mapContentToResources(content, version);

				if (!Array.isArray(resources)) {
					organizationBuilder.addResource(resources);
				}

				if (Array.isArray(resources)) {
					const subOrganizationBuilder = organizationBuilder.addSubOrganization(
						CommonCartridgeMapper.mapContentToOrganization(content)
					);

					resources.forEach((resource) => {
						subOrganizationBuilder.addResource(resource);
					});
				}
			});
		});
	}

	private async addTasks(
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		courseId: EntityId,
		userId: EntityId
	): Promise<void> {
		const [tasks] = await this.taskService.findBySingleParent(userId, courseId);
		const organizationBuilder = builder.addOrganization({
			identifier: new ObjectId().toHexString(),
			title: '', // FIXME: add title
		});

		tasks.forEach((task) => {
			organizationBuilder.addResource(CommonCartridgeMapper.mapTaskToResource(task, version));
		});
	}
}
