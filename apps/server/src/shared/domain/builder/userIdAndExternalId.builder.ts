import { UserIdAndExternalId } from '../interface';

export class UserIdAndExternalIdBuilder {
	static build(userId: string, externalId?: string): UserIdAndExternalId {
		const userIdAndExternalId = { userId, externalId };

		return userIdAndExternalId;
	}
}
