import { Injectable } from '@nestjs/common';
import { EntityId, Lesson, Task } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import { ICommonCartridgeAssignmentProps } from '@src/modules/learnroom/common-cartridge/common-cartridge-assignment-element';
import { FileDto, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { FileRecordParentType } from '@src/modules/files-storage/entity';
import { CourseService } from './course.service';
import {
	ICommonCartridgeOrganizationProps,
	CommonCartridgeFileBuilder,
	ICommonCartridgeWebContentProps,
} from '../common-cartridge';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);
		const [tasks] = await this.taskService.findBySingleParent(userId, courseId);

		const allFiles: FileDto[] = [];
		const schoolId = course.school.id;
		allFiles.push(...(await this.addFiles(FileRecordParentType.Course, schoolId, course.id)));
		for (const lesson of lessons) {
			// eslint-disable-next-line no-await-in-loop
			allFiles.push(...(await this.addFiles(FileRecordParentType.Lesson, schoolId, lesson.id)));
		}
		for (const task of tasks) {
			// eslint-disable-next-line no-await-in-loop
			allFiles.push(...(await this.addFiles(FileRecordParentType.Task, schoolId, task.id)));
		}

		const builder = new CommonCartridgeFileBuilder({
			identifier: `i${course.id}`,
			title: course.name,
		})
			.addOrganizationItems(this.mapLessonsToOrganizationItems(lessons))
			.addAssignments(this.mapTasksToAssignments(tasks))
			.addWebContentItems(this.mapToWebContent(allFiles));
		return builder.build();
	}

	private async addFiles(parentType: FileRecordParentType, schoolId: EntityId, parentId: EntityId): Promise<FileDto[]> {
		const param = { parentType, schoolId, parentId };
		return this.filesStorageClientAdapterService.listFilesOfParent(param);
	}

	private mapLessonsToOrganizationItems(lessons: Lesson[]): ICommonCartridgeOrganizationProps[] {
		return lessons.map((lesson) => {
			return {
				identifier: `i${lesson.id}`,
				title: lesson.name,
			};
		});
	}

	private mapTasksToAssignments(tasks: Task[]): ICommonCartridgeAssignmentProps[] {
		return tasks.map((task) => {
			return {
				identifier: `i${task.id}`,
				title: task.name,
				description: task.description,
			};
		});
	}

	private mapToWebContent(fileInfos: FileDto[]): ICommonCartridgeWebContentProps[] {
		const webContentProps: ICommonCartridgeWebContentProps[] = [];
		for (const fileInfo of fileInfos) {
			webContentProps.push({
				identifier: this.getIdentifierString(fileInfo.id),
				href: fileInfo.name,
				file: Buffer.from(''),
				parentFolder:
					fileInfo.parentType === FileRecordParentType.Lesson || fileInfo.parentType === FileRecordParentType.Task
						? this.getIdentifierString(fileInfo.parentId)
						: undefined,
			});
		}
		return webContentProps;
	}

	private getIdentifierString(id: string): string {
		return `i${id}`;
	}
}
