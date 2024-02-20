import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { UserRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { UserListResponse, UserResponse, UsersSearchQueryParams } from '../controller/dto';
import {UsersAdminRepo} from "@modules/user/legacy/repo/users-admin.repo";

@Injectable()
export class AdminUsersService {
	constructor(private readonly usersAdminRepo: UsersAdminRepo, private readonly logger: Logger) {
		this.logger.setContext(AdminUsersService.name);
	}

	async getUsersWithNestedData(
		roleId: string | undefined,
		schoolId: EntityId,
		schoolYearId: EntityId | undefined,
		params: UsersSearchQueryParams
	): Promise<UserListResponse> {
		const usersResponse = await this.usersAdminRepo.getUsersWithNestedData(roleId, schoolId, schoolYearId, params);
		return new UserListResponse(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			usersResponse[0].data,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
			usersResponse[0].total,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
			usersResponse[0].limit,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
			usersResponse[0].skip
		);
	}

	async getUserWithNestedData(
		roleId: string | undefined,
		schoolId: EntityId,
		schoolYearId: EntityId | undefined,
		userId?: string
	): Promise<UserResponse> {
		const user = await this.usersAdminRepo.getUserByIdWithNestedData(roleId, schoolId, schoolYearId, userId);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return new UserResponse(user[0]);
	}
}
