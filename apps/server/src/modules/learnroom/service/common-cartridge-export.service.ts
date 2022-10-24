import { Injectable } from '@nestjs/common';
import { EntityId, Lesson } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { CourseService } from './course.service';
import { ICommonCartridgeOrganizationProps, CommonCartridgeFileBuilder } from '../common-cartridge';

@Injectable()
export class CommonCartridgeExportService {
	constructor(private readonly courseService: CourseService, private readonly lessonService: LessonService) {}

	async exportCourse(courseId: EntityId): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);
		return (
			new CommonCartridgeFileBuilder({
				identifier: `i${course.id}`,
				title: course.name,
			})
				.addOrganizationItems(this.mapLessonsToOrganizationItems(lessons))
				// we are adding one resource here for testing purpose
				.addResourceItems({
					identifier: 'placeholder-identifier',
					type: 'webcontent',
					href: 'placeholder.html',
				})
				.build()
		);
	}

	private mapLessonsToOrganizationItems(lessons: Lesson[]): ICommonCartridgeOrganizationProps[] {
		return lessons.map((lesson) => {
			return {
				identifier: `i_${lesson.id}`,
				title: lesson.name,
			};
		});
	}
}
