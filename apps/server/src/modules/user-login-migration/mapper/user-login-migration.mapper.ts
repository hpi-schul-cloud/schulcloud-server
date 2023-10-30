import { UserLoginMigrationDO } from '@shared/domain/domainobject/user-login-migration.do';
import { UserLoginMigrationSearchParams } from '../controller/dto/request/user-login-migration-search.params';
import { UserLoginMigrationResponse } from '../controller/dto/response/user-login-migration.response';
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
