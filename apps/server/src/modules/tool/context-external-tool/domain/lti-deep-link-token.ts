import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface LtiDeepLinkTokenProps extends AuthorizableObject {
	state: string;

	userId: EntityId;

	expiresAt: Date;
}

export class LtiDeepLinkToken extends DomainObject<LtiDeepLinkTokenProps> {
	get state(): string {
		return this.props.state;
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}
}
