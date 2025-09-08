import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { MediaSourceDataFormat } from '../enum';
import { MediaSourceOauthConfig } from './media-source-oauth-config';
import { MediaSourceVidisConfig } from './media-source-vidis-config';

export interface MediaSourceProps extends AuthorizableObject {
	id: string;

	sourceId: string;

	name?: string;

	oauthConfig?: MediaSourceOauthConfig;

	vidisConfig?: MediaSourceVidisConfig;

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

	get vidisConfig(): MediaSourceVidisConfig | undefined {
		return this.props.vidisConfig;
	}
}
