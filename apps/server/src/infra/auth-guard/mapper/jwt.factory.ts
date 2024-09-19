import { CreateJwtPayload, ICurrentUser } from '../interface';

export class JwtPayloadFactory {
	private static build(data: CreateJwtPayload): CreateJwtPayload {
		return data;
	}

	public static buildFromCurrentUser(currentUser: ICurrentUser): CreateJwtPayload {
		const data = {
			accountId: currentUser.accountId,
			userId: currentUser.userId,
			schoolId: currentUser.schoolId,
			roles: currentUser.roles,
			systemId: currentUser.systemId,
			support: currentUser.impersonated,
			isExternalUser: currentUser.isExternalUser,
		};

		const createJwtPayload = JwtPayloadFactory.build(data);

		return createJwtPayload;
	}
}
