import { Course } from '../domain';
import { CourseInfoDto } from '../uc/dto';

export class CourseInfoMapper {
public static mapCourseToCourseInfoDto(
	course: Course,
): CourseInfoDto {
	const mapped: CourseInfoDto = new CourseInfoDto({
	id: course.id,
	name: course.name,
	teacherNames: course.teachers,
	classes: course.getProps().classIds,

	}
})
}
