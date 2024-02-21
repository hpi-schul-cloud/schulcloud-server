import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { UsersAdminRepo } from '../repo';
import { UserListResponse, UserResponse, UsersSearchQueryParams } from '../controller/dto';

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
		const usersResponse = (await this.usersAdminRepo.getUsersWithNestedData(
			roleId,
			schoolId,
			schoolYearId,
			params
		)) as UserListResponse[];
		return new UserListResponse(usersResponse[0]);
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
