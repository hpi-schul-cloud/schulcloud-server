import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ClassService } from '@modules/class';
import { Group, GroupService } from '@modules/group';
import { RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { SortHelper } from '@shared/common';
import { PaginationParams } from '@shared/controller/';
import { Page, UserDO } from '@shared/domain/domainobject';
import { Course as CourseEntity, User } from '@shared/domain/entity';
import { Pagination, Permission, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { CourseSortQueryType } from '../controller/dto/interface/course-sort-query-type.enum';
import { CourseStatusQueryType } from '../controller/dto/interface/course-status-query-type.enum';
import { Course } from '../domain';
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

	public async findAllCourses(
		userId: EntityId,
		schoolId: EntityId,
		sortBy: CourseSortQueryType = CourseSortQueryType.NAME,
		courseStatusQueryType?: CourseStatusQueryType,
		pagination?: Pagination,
		sortOrder?: SortOrder
	): Promise<Page<CourseInfoDto>> {
		const school: School = await this.schoolService.getSchoolById(schoolId);

		const user: User = await this.authService.getUserWithPermissions(userId);
		this.authService.checkPermission(user, school, AuthorizationContextBuilder.read([Permission.ADMIN_VIEW]));

		const courses: Course[] = await this.courseDoService.findCoursesBySchool(schoolId);

		const courseInfosFromCourses: CourseInfoDto[] = await this.getCourseInfosFromCourses(
			courses,
			courseStatusQueryType
		);

		courseInfosFromCourses.sort((a: CourseInfoDto, b: CourseInfoDto): number =>
			SortHelper.genericSortFunction(a[sortBy], b[sortBy], sortOrder)
		);

		const pageContent: CourseInfoDto[] = this.applyPagination(
			courseInfosFromCourses,
			pagination?.skip,
			pagination?.limit
		);

		const page: Page<CourseInfoDto> = new Page<CourseInfoDto>(pageContent, courseInfosFromCourses.length);

		return page;
	}

	private async getCourseInfosFromCourses(
		courses: Course[],
		courseStatusQueryType: CourseStatusQueryType | undefined
	): Promise<CourseInfoDto[]> {
		const now = new Date();
		let untilDate;
		let allCourses: Course[];
		if (!courseStatusQueryType || courseStatusQueryType === CourseStatusQueryType.CURRENT) {
			allCourses = courses.filter((course: Course) => {
				untilDate = course.untilDate ?? now.getDate() + 1;
				return now < untilDate;
			});
		} else {
			allCourses = courses.filter((course) => {
				untilDate = course.untilDate ?? now.getDate() + 1;
				return now > untilDate;
			});
		}

		const resolvedCourses = await this.getCourseData(allCourses);

		return resolvedCourses;
	}

	private applyPagination(courseInfo: CourseInfoDto[], skip = 0, limit?: number): CourseInfoDto[] {
		let page: CourseInfoDto[];

		if (limit === -1) {
			page = courseInfo.slice(skip);
		} else {
			page = courseInfo.slice(skip, limit ? skip + limit : courseInfo.length);
		}

		return page;
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

	private async getCourseData(courses: Course[]) {
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
}
