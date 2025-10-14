import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { UserResponse, UsersSearchQueryParams } from '../controller/dto';
import { UsersAdminRepo } from '../repo';
import { UserAggregationResult } from '../repo/user-aggregation-result';

@Injectable()
export class UsersAdminService {
	constructor(private readonly usersAdminRepo: UsersAdminRepo, private readonly logger: Logger) {
		this.logger.setContext(UsersAdminService.name);
	}

	public async getUsersWithNestedData(
		roleId: string | undefined,
		schoolId: EntityId,
		schoolYearId: EntityId | undefined,
		params: UsersSearchQueryParams
	): Promise<UserAggregationResult[]> {
		const users = await this.usersAdminRepo.getUsersWithNestedData(roleId, schoolId, schoolYearId, params);

		return users;
	}

	public async getUserWithNestedData(
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
			throw new EntityNotFoundError('User');
		}
		return new UserResponse(user[0]);
	}
}
