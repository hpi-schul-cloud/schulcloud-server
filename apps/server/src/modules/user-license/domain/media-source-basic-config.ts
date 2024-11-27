import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface MediaSourceBasicConfigProps extends AuthorizableObject {
	id: EntityId;

	username: string;

	password: string;

	authEndpoint: string;
}

export class MediaSourceBasicConfig extends DomainObject<MediaSourceBasicConfigProps> {}
