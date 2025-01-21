import { AuthorizationService } from '@modules/authorization';
import { RoleService } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller/dto';
import { Course } from '@shared/domain/entity';
import { Permission, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo/course';
import { ICurrentUser } from '@src/infra/auth-guard';
import { RoleNameMapper } from '../mapper/rolename.mapper';
import { CourseService } from '../service';

@Injectable()
export class CourseUc {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly courseService: CourseService,
		private readonly authService: AuthorizationService,
		private readonly roleService: RoleService,
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

	public async findCourseById(courseId: EntityId): Promise<Course> {
		const course = await this.courseService.findById(courseId);

		return course;
	}

	public async createCourse(currentUser: ICurrentUser, name: string): Promise<void> {
		const user = await this.authService.getUserWithPermissions(currentUser.userId);

		this.authService.checkAllPermissions(user, [Permission.COURSE_CREATE]);

		const course = new Course({ teachers: [user], school: user.school, name });

		await this.courseService.create(course);
	}
}
