import { AuthorizationService } from '@modules/authorization';
import { RoleService } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller/';
import { Course, CourseProperties } from '@shared/domain/entity';
import { SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { ICurrentUser } from '@src/infra/auth-guard';
import { RoleNameMapper } from '../mapper/rolename.mapper';
import { CourseService } from '../service';

@Injectable()
export class CourseUc {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly courseService: CourseService,
		private readonly authService: AuthorizationService,
		private readonly roleService: RoleService
	) {}

	public findAllByUser(userId: EntityId, options?: PaginationParams): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(userId, {}, { pagination: options, order: { updatedAt: SortOrder.desc } });
	}

	public async getUserPermissionByCourseId(userId: EntityId, courseId: EntityId): Promise<string[]> {
		const course = await this.courseService.findById(courseId);
		const user = await this.authService.getUserWithPermissions(userId);
		const userRole = RoleNameMapper.mapToRoleName(user, course);
		const role = await this.roleService.findByName(userRole);

		return role.permissions ?? [];
	}

	public findCourseById(courseId: EntityId): Promise<Course> {
		return this.courseService.findById(courseId);
	}

	public async createCourse(user: ICurrentUser, props: CourseProperties): Promise<Course> {
		const course = new Course({
			school: user.schoolId,
		});

		return this.courseService.create({ title, description });
	}
}
