import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { CourseService } from './course.service';
import { ImsccFileBuilder } from '../imscc';

@Injectable()
export class CourseExportService {
	constructor(private readonly courseService: CourseService, private readonly lessonService: LessonService) {}

	async exportCourse(courseId: EntityId): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);
		return new ImsccFileBuilder({
			title: course.name,
		})
			.addOrganizationItems(
				lessons.map((lesson) => {
					return {
						identifier: lesson.id,
						title: lesson.name,
					};
				})
			)
			.addResourceItems({
				identifier: 'placeholder-identifier',
				type: 'webcontent',
				href: 'placeholder.html',
				file: 'placeholder.html',
			})
			.build();
	}
}
