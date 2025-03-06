import { UserLoginMigrationDO } from '../../domain';
import { UserLoginMigrationQuery } from '../../domain/interface';
import { UserLoginMigrationResponse, UserLoginMigrationSearchParams } from '../dto';

export class UserLoginMigrationMapper {
	static mapSearchParamsToQuery(searchParams: UserLoginMigrationSearchParams): UserLoginMigrationQuery {
		const query: UserLoginMigrationQuery = {
			userId: searchParams.userId,
		};

		return query;
	}

	static mapUserLoginMigrationDoToResponse(domainObject: UserLoginMigrationDO): UserLoginMigrationResponse {
		const response: UserLoginMigrationResponse = new UserLoginMigrationResponse({
			id: domainObject.id as string,
			sourceSystemId: domainObject.sourceSystemId,
			targetSystemId: domainObject.targetSystemId,
			startedAt: domainObject.startedAt,
			closedAt: domainObject.closedAt,
			finishedAt: domainObject.finishedAt,
			mandatorySince: domainObject.mandatorySince,
		});

		return response;
	}
}
