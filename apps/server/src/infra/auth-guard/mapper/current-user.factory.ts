import { EntityId } from '@shared/domain/types';
import { ICurrentUser, JwtPayload } from '../interface';

export interface BaseCurrentUser {
	userId: EntityId;
	schoolId: EntityId;
	accountId: EntityId;
	systemId?: EntityId;
}

// TODO: I expect that builder pattern match better the need, let speak in review about it
export class CurrentUserFactory {
	public static build(
		base: BaseCurrentUser,
		roles: EntityId[],
		isExternalUser = false,
		impersonated = false,
		externalIdToken?: string
	): ICurrentUser {
		const currentUser = {
			userId: base.userId,
			roles,
			schoolId: base.schoolId,
			accountId: base.accountId,
			systemId: base.systemId,
			impersonated,
			isExternalUser,
			externalIdToken,
		};

		return currentUser;
	}

	public static buildFromJwt(jwtPayload: JwtPayload): ICurrentUser {
		const base: BaseCurrentUser = {
			accountId: jwtPayload.accountId,
			systemId: jwtPayload.systemId,
			schoolId: jwtPayload.schoolId,
			userId: jwtPayload.userId,
		};

		const currentUser = CurrentUserFactory.build(base, jwtPayload.roles, jwtPayload.isExternalUser, jwtPayload.support);

		return currentUser;
	}

	public static buildWithExternalToken(
		base: BaseCurrentUser,
		roles: EntityId[],
		externalIdToken?: string
	): ICurrentUser {
		const currentUser = CurrentUserFactory.build(base, roles, true, false, externalIdToken);

		return currentUser;
	}
}
