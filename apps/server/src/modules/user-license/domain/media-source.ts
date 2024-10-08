import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { MediaSourceOauthConfig } from './media-source-oauth-config';
import { MediaSourceDataFormat } from '../enum';

export interface MediaSourceProps extends AuthorizableObject {
	id: string;

	name?: string;

	sourceId: string;

	format?: MediaSourceDataFormat;

	config?: MediaSourceOauthConfig;
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

	get config(): MediaSourceOauthConfig | undefined {
		return this.props.config;
	}
}
