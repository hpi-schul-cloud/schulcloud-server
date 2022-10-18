import {Actions, EntityId, Permission} from '@shared/domain';
import {AuthorizationService} from '@src/modules';
import {AllowedAuthorizationEntityType} from '@src/modules/authorization/interfaces';
import {CourseExportService} from "@src/modules/learnroom/service/course-export.service";

export class CourseExportUc {
	constructor(
		private readonly courseExportService: CourseExportService,
		private readonly authorizationService: AuthorizationService
	) {}

	async export(courseId: EntityId, userId: EntityId): Promise<Buffer> {
		await this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.Course,
			courseId,
			{
				action: Actions.read,
				requiredPermissions: [Permission.COURSE_EDIT],
			}
		);

		return this.courseExportService.export(userId);
	}

    async exportCourse(courseId: EntityId, userId: EntityId): Promise<Buffer> {
        await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.Course, courseId, {
            action: Actions.read,
            requiredPermissions: [Permission.COURSE_EDIT],
        });
        const course = await this.courseRepo.findOne(courseId, userId);
        const [lessons] = await this.lessonRepo.findAllByCourseIds([courseId]);
        return new ImsccFileBuilder({
            title: course.name,
        })
        .addOrganizations(
            lessons.map((lesson) => {
                return {
                    identifier: lesson.id,
                    title: lesson.name,
                };
            })
            )
        .addResources({
            identifier: 'placeholder-identifier',
            type: 'webcontent',
            href: 'placeholder.html',
            file: 'placeholder.html',
        })
        .build();
    }
}

