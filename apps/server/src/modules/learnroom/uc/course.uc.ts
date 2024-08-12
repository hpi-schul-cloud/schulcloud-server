import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { RoleService } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { SortHelper } from '@shared/common';
import { PaginationParams } from '@shared/controller/';
import { Page } from '@shared/domain/domainobject';
import { Course as CourseEntity, User } from '@shared/domain/entity';
import { Pagination, Permission, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { ClassInfoDto } from '../../group/uc/dto';
import { School, SchoolService } from '../../school';
import { CourseRequestContext } from '../controller/dto/interface/course-request-context.enum';
import { CourseSortQueryType } from '../controller/dto/interface/course-sort-query-type.enum';
import { SchoolYearQueryType } from '../controller/dto/interface/school-year-query-type.enum';
import { Course } from '../domain';
import { CourseInfoMapper } from '../mapper/course-info.mapper';
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
		private readonly courseDoService: CourseDoService
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
		schoolYearQueryType?: SchoolYearQueryType,
		calledFrom?: CourseRequestContext,
		pagination?: Pagination,
		sortOrder?: SortOrder
	): Promise<Page<ClassInfoDto>> {
		const school: School = await this.schoolService.getSchoolById(schoolId);

		const user: User = await this.authService.getUserWithPermissions(userId);
		this.authService.checkPermission(user, school, AuthorizationContextBuilder.read([Permission.ADMIN_VIEW]));

		// const courses: Course[] = await this.courseDoService.findCoursesBySchool(schoolId);
		const courses: Course[] = await this.courseDoService.findCoursesBySchool(schoolId);

		const courseInfosFromCourses: Course[] = this.getCourseInfosFromCourses(courses, schoolYearQueryType);

		const coursesInfo = courseInfosFromCourses.map((course) => CourseInfoMapper.mapCourseToCourseInfoDto(course));

		coursesInfo.sort((a: CourseInfoDto, b: CourseInfoDto): number =>
			SortHelper.genericSortFunction(a[sortBy], b[sortBy], sortOrder)
		);

		const pageContent: ClassInfoDto[] = this.applyPagination(combinedClassInfo, pagination?.skip, pagination?.limit);

		const page: Page<ClassInfoDto> = new Page<ClassInfoDto>(pageContent, combinedClassInfo.length);

		return page;
	}

	private getCourseInfosFromCourses(courses: Course[], schoolYearQueryType: SchoolYearQueryType | undefined): Course[] {
		const now = new Date();
		let untilDate;
		const allCourses = courses;
		if (!schoolYearQueryType || schoolYearQueryType === SchoolYearQueryType.CURRENT_YEAR) {
			allCourses.filter((course: Course) => {
				untilDate = course.untilDate ?? now.getDate() + 1;
				return now < untilDate;
			});
		} else {
			allCourses.filter((course) => {
				untilDate = course.untilDate ?? now.getDate() + 1;
				return now > untilDate;
			});
		}

		return allCourses;
	}
}
