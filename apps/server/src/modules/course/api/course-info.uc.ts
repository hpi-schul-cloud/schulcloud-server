import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { GroupService } from '@modules/group';
import { SchoolService } from '@modules/school';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { Pagination, Permission, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Course, CourseDoService, CourseStatus } from '../domain';
import { CourseSortProps } from '../domain/interface/course-sort-props.enum';
import { CourseInfoDto } from './dto';

@Injectable()
export class CourseInfoUc {
	constructor(
		private readonly authService: AuthorizationService,
		private readonly schoolService: SchoolService,
		private readonly courseDoService: CourseDoService,
		private readonly groupService: GroupService,
		private readonly userService: UserService,
		private readonly classService: ClassService
	) {}

	public async getCourseInfo(
		userId: EntityId,
		schoolId: EntityId,
		sortByField: CourseSortProps = CourseSortProps.NAME,
		courseStatusQueryType?: CourseStatus,
		withoutTeacher?: boolean,
		pagination?: Pagination,
		sortOrder: SortOrder = SortOrder.asc
	): Promise<Page<CourseInfoDto>> {
		const school = await this.schoolService.getSchoolById(schoolId);

		const user = await this.authService.getUserWithPermissions(userId);
		this.authService.checkPermission(
			user,
			school,
			AuthorizationContextBuilder.read([Permission.COURSE_ADMINISTRATION])
		);

		const order = { [sortByField]: sortOrder };
		const filter = { schoolId, status: courseStatusQueryType, withoutTeacher };
		const options = { pagination, order };
		const courses = await this.courseDoService.getCourseInfo(filter, options);

		const resolvedCourses = await this.getCourseData(courses.data);

		const page = new Page<CourseInfoDto>(resolvedCourses, courses.total);

		return page;
	}

	private async getCourseData(courses: Course[]): Promise<CourseInfoDto[]> {
		const courseInfos = await Promise.all(
			courses.map(async (course) => {
				const groupName = course.syncedWithGroup
					? await this.groupService.getGroupName(course.syncedWithGroup)
					: undefined;
				let teacherNames: string[] = [];
				if (course.teachers) {
					teacherNames = await this.getCourseTeacherFullNames(course.teachers);
				}
				const classNames = await this.getCourseClassNames(course.classes);
				const groupNames = await this.getCourseGroupNames(course.groups);

				const mapped = new CourseInfoDto({
					id: course.id,
					name: course.name,
					classes: [...classNames, ...groupNames],
					teachers: teacherNames,
					syncedGroupName: groupName,
				});

				return mapped;
			})
		);

		return courseInfos;
	}

	private async getCourseTeacherFullNames(teacherIds: EntityId[]): Promise<string[]> {
		const teachers = await this.userService.findExistingUsersByIds(teacherIds);
		const teacherFullNames = teachers.map((teacher) => teacher.firstName.concat(' ', teacher.lastName));

		return teacherFullNames;
	}

	private async getCourseClassNames(classIds: EntityId[]): Promise<string[]> {
		const classes = await this.classService.findExistingClassesByIds(classIds);
		const classNames = classes.map((clazz) => clazz.getClassFullName());

		return classNames;
	}

	private async getCourseGroupNames(groupIds: EntityId[]): Promise<string[]> {
		const groups = await this.groupService.findExistingGroupsByIds(groupIds);
		const groupNames = groups.map((group) => group.name);

		return groupNames;
	}
}
