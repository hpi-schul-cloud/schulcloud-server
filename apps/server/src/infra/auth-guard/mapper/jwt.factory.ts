import { EntityId } from '@shared/domain/types';
import { CreateJwtPayload, ICurrentUser } from '../interface';

export class JwtPayloadFactory {
	private readonly currentUser: ICurrentUser;

	private systemUser = false;

	private support = false;

	private supportUserId: EntityId | undefined = undefined;

	constructor(currentUser: ICurrentUser) {
		this.currentUser = currentUser;
	}

	public asSystemUser(): this {
		this.systemUser = true;

		return this;
	}

	public asSupportUser(supportUserId: EntityId): this {
		this.support = true;
		this.supportUserId = supportUserId;

		return this;
	}

	public build(): CreateJwtPayload {
		return {
			accountId: this.currentUser.accountId,
			userId: this.currentUser.userId,
			schoolId: this.currentUser.schoolId,
			roles: this.currentUser.roles,
			systemId: this.currentUser.systemId,
			systemUser: this.systemUser,
			support: this.support,
			supportUserId: this.supportUserId,
			isExternalUser: this.currentUser.isExternalUser,
		};
	}
}
