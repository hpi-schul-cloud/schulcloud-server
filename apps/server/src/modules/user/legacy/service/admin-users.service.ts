import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { User } from '@shared/domain/entity';
import { EntityNotFoundError } from '@shared/common';
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
		try {
			const usersResponse = (await this.usersAdminRepo.getUsersWithNestedData(
				roleId,
				schoolId,
				schoolYearId,
				params
			)) as UserListResponse[];
			return new UserListResponse(usersResponse[0]);
		} catch (e) {
			console.log(e);
		}

		return new UserListResponse({ data: [], limit: 0, skip: 0, total: 0 });
	}

	async getUserWithNestedData(
		roleId: string | undefined,
		schoolId: EntityId,
		schoolYearId: EntityId | undefined,
		userId?: string
	): Promise<UserResponse> {
		const user = (await this.usersAdminRepo.getUserByIdWithNestedData(
			roleId,
			schoolId,
			schoolYearId,
			userId
		)) as UserResponse[];
		if (user.length < 1) {
			throw new EntityNotFoundError(User.name);
		}
		return new UserResponse(user[0]);
	}
}