import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { UserRepo } from '@shared/repo';
import { ForbiddenOperationError } from '@shared/common';
import { RoleService } from '../../../role';
import { AuthorizationService } from '../../../authorization';
import { UsersAdminContextEnum } from '../enum';
import { UserByIdParams, UserListResponse, UserResponse, UsersSearchQueryParams } from '../controller/dto';
import { AdminUsersService } from '../service';

@Injectable()
export class AdminApiUsersUc {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly roleService: RoleService,
		private readonly adminUsersService: AdminUsersService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async findUsersByParams(
		context: UsersAdminContextEnum,
		currentUserId: string,
		params: UsersSearchQueryParams
	): Promise<UserListResponse> {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		this.validateAccessToContext(context, currentUser);
		const { school } = currentUser;
		const currentSchoolYear = school.currentYear;
		const currentSchoolYearId = currentSchoolYear?.id;
		const contextRole = await this.getRoleForContext(context);

		return this.adminUsersService.getUsersWithNestedData(contextRole?.id, school.id, currentSchoolYearId, params);
	}

	public async findUserById(
		context: UsersAdminContextEnum,
		currentUserId: string,
		params: UserByIdParams
	): Promise<UserResponse> {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		this.validateAccessToContext(context, currentUser);
		const { school } = currentUser;
		const currentSchoolYear = school.currentYear;
		const currentSchoolYearId = currentSchoolYear?.id;
		const contextRole = await this.getRoleForContext(context);

		return this.adminUsersService.getUserWithNestedData(contextRole?.id, school.id, currentSchoolYearId, params.id);
	}

	private validateAccessToContext(context: UsersAdminContextEnum, currentUser: User) {
		const permission = this.getPermissionForContext(context);
		try {
			this.authorizationService.checkAllPermissions(currentUser, [permission]);
		} catch (e) {
			throw new ForbiddenOperationError(`Current user is not authorized to search for ${context.valueOf()}.`);
		}
	}

	private getPermissionForContext(context: UsersAdminContextEnum) {
		if (context === UsersAdminContextEnum.TEACHERS) {
			return Permission.TEACHER_LIST;
		}

		return Permission.STUDENT_LIST;
	}

	private getRoleForContext(context: UsersAdminContextEnum) {
		if (context === UsersAdminContextEnum.TEACHERS) {
			return this.roleService.findByName(RoleName.TEACHER);
		}

		return this.roleService.findByName(RoleName.STUDENT);
	}
}
