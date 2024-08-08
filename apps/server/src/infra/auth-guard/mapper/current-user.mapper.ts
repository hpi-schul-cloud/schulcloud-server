import { ICurrentUser } from '../interface';
import { CreateJwtPayload, JwtPayload } from '../interface/jwt-payload';

export class CurrentUserMapper {
	static mapCurrentUserToCreateJwtPayload(currentUser: ICurrentUser): CreateJwtPayload {
		return {
			accountId: currentUser.accountId,
			userId: currentUser.userId,
			schoolId: currentUser.schoolId,
			roles: currentUser.roles,
			systemId: currentUser.systemId,
			support: currentUser.impersonated,
			isExternalUser: currentUser.isExternalUser,
		};
	}

	static jwtToICurrentUser(jwtPayload: JwtPayload): ICurrentUser {
		return {
			accountId: jwtPayload.accountId,
			systemId: jwtPayload.systemId,
			roles: jwtPayload.roles,
			schoolId: jwtPayload.schoolId,
			userId: jwtPayload.userId,
			impersonated: jwtPayload.support,
			isExternalUser: jwtPayload.isExternalUser,
		};
	}
}
