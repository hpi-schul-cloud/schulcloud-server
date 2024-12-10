import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { MediaSourceBasicAuthConfig } from './media-source-basic-auth-config';
import { MediaSourceOauthConfig } from './media-source-oauth-config';
import { MediaSourceDataFormat } from '../enum';

export interface MediaSourceProps extends AuthorizableObject {
	id: string;

	name?: string;

	sourceId: string;

	oauthConfig?: MediaSourceOauthConfig;

	basicAuthConfig?: MediaSourceBasicAuthConfig;

	format?: MediaSourceDataFormat;
}

export class MediaSource extends DomainObject<MediaSourceProps> {
	get name(): string | undefined {
		return this.props.name;
	}

	get sourceId(): string {
		return this.props.sourceId;
	}

	get format(): MediaSourceDataFormat | undefined {
		return this.props.format;
	}

	get oauthConfig(): MediaSourceOauthConfig | undefined {
		return this.props.oauthConfig;
	}

	get basicAuthConfig(): MediaSourceBasicAuthConfig | undefined {
		return this.props.basicAuthConfig;
	}
}
