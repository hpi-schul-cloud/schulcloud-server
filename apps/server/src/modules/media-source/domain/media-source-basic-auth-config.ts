import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface MediaSourceBasicAuthConfigProps extends AuthorizableObject {
	id: EntityId;

	username: string;

	password: string;

	authEndpoint: string;
}

export class MediaSourceBasicAuthConfig extends DomainObject<MediaSourceBasicAuthConfigProps> {
	get username(): string {
		return this.props.username;
	}

	get password(): string {
		return this.props.password;
	}

	get authEndpoint(): string {
		return this.props.authEndpoint;
	}
}
