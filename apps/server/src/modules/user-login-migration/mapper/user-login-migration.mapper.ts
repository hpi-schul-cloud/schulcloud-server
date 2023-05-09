import { UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationResponse, UserLoginMigrationSearchParams } from '../controller/dto';
import { UserLoginMigrationQuery } from '../uc/dto/user-login-migration-query';

export class UserLoginMigrationMapper {
	static mapSearchParamsToQuery(searchParams: UserLoginMigrationSearchParams): UserLoginMigrationQuery {
		const query: UserLoginMigrationQuery = {
			userId: searchParams.userId,
		};
		return query;
	}

	static mapUserLoginMigrationDoToResponse(domainObject: UserLoginMigrationDO): UserLoginMigrationResponse {
		const response: UserLoginMigrationResponse = new UserLoginMigrationResponse({
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
