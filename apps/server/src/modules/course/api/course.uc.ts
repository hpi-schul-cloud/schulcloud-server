import { ICurrentUser } from '@infra/auth-guard';
import { AuthorizationService } from '@modules/authorization';
import { RoleService } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller/dto';
import { Permission, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseService, RoleNameMapper } from '../domain';
import { CourseEntity } from '../repo';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CourseUc {
	constructor(
		private readonly courseService: CourseService,
		private readonly authService: AuthorizationService,
		private readonly roleService: RoleService
	) {}

	public findAllByUser(
		userId: EntityId,
		schoolId: string,
		options?: PaginationParams
	): Promise<Counted<CourseEntity[]>> {
		return this.courseService.findAllByUserId(
			userId,
			schoolId,
			{},
			{ pagination: options, order: { updatedAt: SortOrder.desc } }
		);
	}

	public async getUserPermissionByCourseId(userId: EntityId, courseId: EntityId): Promise<string[]> {
		const course = await this.courseService.findById(courseId);
		const user = await this.authService.getUserWithPermissions(userId);
		const userRole = RoleNameMapper.mapToRoleName(user, course);
		const role = await this.roleService.findByName(userRole);

		return role.permissions ?? [];
	}

	public async findCourseById(courseId: EntityId): Promise<CourseEntity> {
		const course = await this.courseService.findById(courseId);

		return course;
	}

	public async createCourse(currentUser: ICurrentUser, createCourseParams: CreateCourseDto): Promise<CourseEntity> {
		const user = await this.authService.getUserWithPermissions(currentUser.userId);

		this.authService.checkAllPermissions(user, [Permission.COURSE_CREATE]);

		const course = new CourseEntity({
			...createCourseParams,
			teachers: [user],
			school: user.school,
		});
		const savedCourse = await this.courseService.create(course);

		return savedCourse;
	}
}
