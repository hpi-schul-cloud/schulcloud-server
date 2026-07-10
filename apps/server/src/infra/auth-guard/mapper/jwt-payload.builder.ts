import { type EntityId } from '@shared/domain/types';
import { type CreateJwtPayload, type ICurrentUser } from '../interface';

export class JwtPayloadBuilder {
	private readonly currentUser: ICurrentUser;

	private isServiceAccount = false;

	private support = false;

	private supportUserId: EntityId | undefined = undefined;

	constructor(currentUser: ICurrentUser) {
		this.currentUser = currentUser;
	}

	public asServiceAccount(): this {
		this.isServiceAccount = true;

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
			isServiceAccount: this.isServiceAccount,
			support: this.support,
			supportUserId: this.supportUserId,
			isExternalUser: this.currentUser.isExternalUser,
		};
	}
}
