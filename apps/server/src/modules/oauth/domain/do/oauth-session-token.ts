import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface OauthSessionTokenProps extends AuthorizableObject {
	userId: EntityId;

	systemId: EntityId;

	refreshToken: string;

	expiresAt: Date;
}

export class OauthSessionToken extends DomainObject<OauthSessionTokenProps> {
	get userId(): EntityId {
		return this.props.userId;
	}

	get systemId(): EntityId {
		return this.props.systemId;
	}

	get refreshToken(): string {
		return this.props.refreshToken;
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}
}
