import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { type Class, ClassService } from '@modules/class';
import { type Group, GroupService } from '@modules/group';
import { SchoolService } from '@modules/school';
import { type UserDo, UserService } from '@modules/user';
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
				const groupName = course.syncedWithGroup ? await this.getSyncedGroupName(course.syncedWithGroup) : undefined;
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

	private async getSyncedGroupName(groupId: EntityId): Promise<string | undefined> {
		const group = await this.groupService.tryFindById(groupId);

		return group?.name;
	}

	private async getCourseTeacherFullNames(teacherIds: EntityId[]): Promise<string[]> {
		const teachers = await Promise.all(teacherIds.map((id) => this.userService.findByIdOrNull(id)));

		return teachers
			.filter((teacher): teacher is UserDo => Boolean(teacher))
			.map((teacher) => teacher.firstName.concat(' ', teacher.lastName));
	}

	private async getCourseClassNames(classIds: EntityId[]): Promise<string[]> {
		const classes = await Promise.all(classIds.map((id) => this.classService.findByIdOrNull(id)));

		return classes
			.filter((classItem): classItem is Class => Boolean(classItem))
			.map((clazz) => clazz.getClassFullName());
	}

	private async getCourseGroupNames(groupIds: EntityId[]): Promise<string[]> {
		const groups = await Promise.all(groupIds.map((groupId) => this.groupService.tryFindById(groupId)));

		return groups.filter((groupItem): groupItem is Group => Boolean(groupItem)).map((group) => group.name);
	}
}
