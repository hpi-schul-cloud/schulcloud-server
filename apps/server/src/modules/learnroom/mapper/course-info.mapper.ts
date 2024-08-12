import { Course } from '@shared/domain/entity';
import { ClassEntity } from '../../class/entity';
import { ClassInfoDto, CourseInfoDto } from '../uc/dto';

export class CourseInfoMapper {
	public static mapCourseToCourseInfoDto(course: Course): CourseInfoDto {
		const mapped: CourseInfoDto = new CourseInfoDto({
			id: course.id,
			name: course.name,
			classes: this.mapToClassesInfos(course.classes),
			teachers: course.teachers,
			syncedWithGroup = { name: course.syncedWithGroup?.name, id: course.syncedWithGroup?.id },
		});

		return mapped;
	}

	private static mapToClassesInfos(clazzes) {
		const mapped = clazzes.map((clazz) => this.mapToClassInfo(clazz));

		return mapped;
	}

	private static mapToClassInfo(clazz: ClassEntity) {
		const mapped = new ClassInfoDto({
			id: clazz.id,
			name: clazz.name,
		});
	}

	private static mapToTeacherNames() {}
}
