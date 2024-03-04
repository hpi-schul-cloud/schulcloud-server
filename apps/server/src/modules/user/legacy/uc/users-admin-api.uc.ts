import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { UserRepo } from '@shared/repo';
import { RoleService } from '../../../role';
import {
	AuthorizableReferenceType,
	AuthorizationContextBuilder,
	AuthorizationService,
	ForbiddenLoggableException,
} from '../../../authorization';
import { RequestedRoleEnum } from '../enum';
import { UserByIdParams, UserListResponse, UserResponse, UsersSearchQueryParams } from '../controller/dto';
import { UsersAdminService } from '../service';

@Injectable()
export class UsersAdminApiUc {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly roleService: RoleService,
		private readonly adminUsersService: UsersAdminService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async findUsersByParams(
		context: RequestedRoleEnum,
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
		context: RequestedRoleEnum,
		currentUserId: string,
		params: UserByIdParams
	): Promise<UserResponse> {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		this.validateAccessToContext(context, currentUser);
		const { school } = currentUser;
		const currentSchoolYearId = school.currentYear?.id;
		const contextRole = await this.getRoleForContext(context);

		return this.adminUsersService.getUserWithNestedData(contextRole?.id, school.id, currentSchoolYearId, params.id);
	}

	private validateAccessToContext(context: RequestedRoleEnum, currentUser: User) {
		const permission = this.getPermissionForContext(context);
		try {
			this.authorizationService.checkAllPermissions(currentUser, [permission]);
		} catch (e) {
			// temporary fix for the problem with checkAllPermissions method (throws UnauthorizedException instead of ForbiddenLoggableException)
			const permissionContext = AuthorizationContextBuilder.read([permission]);
			throw new ForbiddenLoggableException(currentUser.id, AuthorizableReferenceType.User, permissionContext);
		}
	}

	private getPermissionForContext(context: RequestedRoleEnum) {
		if (context === RequestedRoleEnum.TEACHERS) {
			return Permission.TEACHER_LIST;
		}

		return Permission.STUDENT_LIST;
	}

	private getRoleForContext(context: RequestedRoleEnum) {
		if (context === RequestedRoleEnum.TEACHERS) {
			return this.roleService.findByName(RoleName.TEACHER);
		}

		return this.roleService.findByName(RoleName.STUDENT);
	}
}
