import { UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationSearchParams, UserLoginMigrationResponse } from '../controller/dto';
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
			// TODO: wont want to make startedAt to optional :/
			startedAt: domainObject.startedAt ?? new Date(0),
			completedAt: domainObject.completedAt,
			finishedAt: domainObject.finishedAt,
			mandatorySince: domainObject.mandatorySince,
		});
		return response;
	}
}
