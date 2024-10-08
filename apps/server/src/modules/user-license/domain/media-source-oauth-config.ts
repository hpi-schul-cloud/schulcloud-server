import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { MediaSourceAuthMethod } from '../enum';
import { EntityId } from '../../../shared/domain/types';

export interface MediaSourceOauthConfigProps extends AuthorizableObject {
	id: EntityId;

	clientId: string;

	clientSecret: string;

	authEndpoint: string;

	method: MediaSourceAuthMethod;
}

export class MediaSourceOauthConfig extends DomainObject<MediaSourceOauthConfigProps> {}
