import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Group, GroupService } from '@modules/group';
import { RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller/';
import { Page, UserDO } from '@shared/domain/domainobject';
import { Course as CourseEntity, User } from '@shared/domain/entity';
import { IFindOptions, Pagination, Permission, SortOrder, SortOrderMap } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { Course as CourseDO } from '../domain';
import { CourseFilter } from '../domain/interface/course-filter';
import { CourseSortQueryType } from '../domain/interface/course-sort-query-type.enum';
import { CourseStatusQueryType } from '../domain/interface/course-status-query-type.enum';
import { RoleNameMapper } from '../mapper/rolename.mapper';
import { CourseDoService, CourseService } from '../service';
import { CourseInfoDto } from './dto';

@Injectable()
export class CourseUc {
	public constructor(
		private readonly courseRepo: CourseRepo,
		private readonly courseService: CourseService,
		private readonly authService: AuthorizationService,
		private readonly roleService: RoleService,
		private readonly schoolService: SchoolService,
		private readonly courseDoService: CourseDoService,
		private readonly groupService: GroupService,
		private readonly userService: UserService,
		private readonly classService: ClassService
	) {}

	public findAllByUser(userId: EntityId, options?: PaginationParams): Promise<Counted<CourseEntity[]>> {
		return this.courseRepo.findAllByUserId(userId, {}, { pagination: options, order: { updatedAt: SortOrder.desc } });
	}

	public async getUserPermissionByCourseId(userId: EntityId, courseId: EntityId): Promise<string[]> {
		const course = await this.courseService.findById(courseId);
		const user = await this.authService.getUserWithPermissions(userId);
		const userRole = RoleNameMapper.mapToRoleName(user, course);
		const role = await this.roleService.findByName(userRole);

		return role.permissions ?? [];
	}

	public async findCourseById(courseId: EntityId): Promise<CourseEntity> {
		return this.courseService.findById(courseId);
	}

	public async findAllCourses(
		userId: EntityId,
		schoolId: EntityId,
		sortByField: CourseSortQueryType = CourseSortQueryType.NAME,
		courseStatusQueryType?: CourseStatusQueryType,
		pagination?: Pagination,
		sortOrder: SortOrder = SortOrder.asc
	): Promise<Page<CourseInfoDto>> {
		const school: School = await this.schoolService.getSchoolById(schoolId);

		const user: User = await this.authService.getUserWithPermissions(userId);
		this.authService.checkPermission(user, school, AuthorizationContextBuilder.read([Permission.ADMIN_VIEW]));

		const order: SortOrderMap<CourseDO> = { [sortByField]: sortOrder };
		const filter: CourseFilter = { schoolId, courseStatusQueryType };
		const options: IFindOptions<CourseDO> = { pagination, order };
		const courses: CourseDO[] = await this.courseDoService.findCourses(filter, options);

		const resolvedCourses: CourseInfoDto[] = await this.getCourseData(courses);

		const page: Page<CourseInfoDto> = new Page<CourseInfoDto>(resolvedCourses, courses.length);

		return page;
	}

	private async getCourseData(courses: CourseDO[]): Promise<CourseInfoDto[]> {
		const courseInfos: CourseInfoDto[] = await Promise.all(
			courses.map(async (course) => {
				const groupName = course.syncedWithGroup ? await this.getSyncedGroupName(course.syncedWithGroup) : undefined;
				const teachers: string[] = await this.getCourseTeachers(course.teachers);
				const classes: string[] = await this.getCourseClasses(course.classes);
				const groups: string[] = await this.getCourseGroups(course.groups);

				const mapped = new CourseInfoDto({
					id: course.id,
					name: course.name,
					classes: [...classes, ...groups],
					teachers,
					syncedWithGroup: groupName,
				});

				return mapped;
			})
		);

		return courseInfos;
	}

	private async getSyncedGroupName(groupId: EntityId): Promise<string> {
		const group: Group = await this.groupService.findById(groupId);

		return group.name;
	}

	private async getCourseTeachers(teacherIds: EntityId[]): Promise<string[]> {
		const teacherNames: string[] = await Promise.all(
			teacherIds.map(async (teacherId): Promise<string> => {
				const teacher: UserDO = await this.userService.findById(teacherId);
				const fullName = teacher.firstName.concat(' ').concat(teacher.lastName);

				return fullName;
			})
		);
		return teacherNames;
	}

	private async getCourseClasses(classIds: EntityId[]): Promise<string[]> {
		const classes: string[] = await Promise.all<Promise<string>[]>(
			classIds.map(async (classId): Promise<string> => {
				const clazz = await this.classService.findById(classId);

				return clazz.gradeLevel ? clazz.gradeLevel?.toString().concat(clazz.name) : clazz.name;
			})
		);
		return classes;
	}

	private async getCourseGroups(groupIds: EntityId[]): Promise<string[]> {
		const groups: string[] = await Promise.all<Promise<string>[]>(
			groupIds.map(async (groupId): Promise<string> => {
				const group = await this.groupService.findById(groupId);

				return group.name;
			})
		);
		return groups;
	}
}
