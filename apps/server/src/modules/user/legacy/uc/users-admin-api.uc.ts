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
		requestedRole: RequestedRoleEnum,
		currentUserId: string,
		params: UsersSearchQueryParams
	): Promise<UserListResponse> {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		this.validateAccessToContext(requestedRole, currentUser);
		const { school } = currentUser;
		const currentSchoolYear = school.currentYear;
		const currentSchoolYearId = currentSchoolYear?.id;
		const role = await this.getRoleForRequestedRole(requestedRole);

		return this.adminUsersService.getUsersWithNestedData(role?.id, school.id, currentSchoolYearId, params);
	}

	public async findUserById(
		requestedRole: RequestedRoleEnum,
		currentUserId: string,
		params: UserByIdParams
	): Promise<UserResponse> {
		const currentUser = await this.userRepo.findById(currentUserId, true);
		this.validateAccessToContext(requestedRole, currentUser);
		const { school } = currentUser;
		const currentSchoolYearId = school.currentYear?.id;
		const role = await this.getRoleForRequestedRole(requestedRole);

		return this.adminUsersService.getUserWithNestedData(role?.id, school.id, currentSchoolYearId, params.id);
	}

	private validateAccessToContext(context: RequestedRoleEnum, currentUser: User) {
		const permission = this.getPermissionForRequestedRole(context);
		try {
			this.authorizationService.checkAllPermissions(currentUser, [permission]);
		} catch (e) {
			// temporary fix for the problem with checkAllPermissions method (throws UnauthorizedException instead of ForbiddenLoggableException)
			const permissionContext = AuthorizationContextBuilder.read([permission]);
			throw new ForbiddenLoggableException(currentUser.id, AuthorizableReferenceType.User, permissionContext);
		}
	}

	private getPermissionForRequestedRole(requestedRole: RequestedRoleEnum) {
		if (requestedRole === RequestedRoleEnum.TEACHERS) {
			return Permission.TEACHER_LIST;
		}

		return Permission.STUDENT_LIST;
	}

	private getRoleForRequestedRole(requestedRole: RequestedRoleEnum) {
		if (requestedRole === RequestedRoleEnum.TEACHERS) {
			return this.roleService.findByName(RoleName.TEACHER);
		}

		return this.roleService.findByName(RoleName.STUDENT);
	}
}
