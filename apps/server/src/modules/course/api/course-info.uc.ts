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
				const groupName = course.syncedWithGroup ? await this.getSyncedGroupName(course.syncedWithGroup) : undefined;
				let teacherNames: string[] = [];
				if (course.teachers) {
					teacherNames = await this.getCourseTeacherFullNames(course.teachers);
				}
				const classNames = await this.getCourseClassNamaes(course.classes);
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

	private async getSyncedGroupName(groupId: EntityId): Promise<string> {
		const group = await this.groupService.findById(groupId);

		return group.name;
	}

	private async getCourseTeacherFullNames(teacherIds: EntityId[]): Promise<string[]> {
		const teacherNames = await Promise.all(
			teacherIds.map(async (teacherId): Promise<string> => {
				const teacher = await this.userService.findById(teacherId);
				const fullName = teacher.firstName.concat(' ', teacher.lastName);

				return fullName;
			})
		);
		return teacherNames;
	}

	private async getCourseClassNamaes(classIds: EntityId[]): Promise<string[]> {
		const classes = await Promise.all<Promise<string>[]>(
			classIds.map(async (classId): Promise<string> => {
				const clazz = await this.classService.findById(classId);

				return clazz.getClassFullName();
			})
		);
		return classes;
	}

	private async getCourseGroupNames(groupIds: EntityId[]): Promise<string[]> {
		const groups = await Promise.all<Promise<string>[]>(
			groupIds.map(async (groupId): Promise<string> => {
				const group = await this.groupService.findById(groupId);

				return group.name;
			})
		);
		return groups;
	}
}
