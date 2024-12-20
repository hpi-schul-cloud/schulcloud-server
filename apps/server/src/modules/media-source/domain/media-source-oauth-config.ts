import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { MediaSourceAuthMethod } from '../enum';

export interface MediaSourceOauthConfigProps extends AuthorizableObject {
	id: EntityId;

	clientId: string;

	clientSecret: string;

	authEndpoint: string;

	method: MediaSourceAuthMethod;
}

export class MediaSourceOauthConfig extends DomainObject<MediaSourceOauthConfigProps> {}
