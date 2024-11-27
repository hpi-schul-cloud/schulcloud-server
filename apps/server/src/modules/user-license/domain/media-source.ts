import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { MediaSourceBasicConfig } from './media-source-basic-config';
import { MediaSourceOauthConfig } from './media-source-oauth-config';
import { MediaSourceDataFormat } from '../enum';

export interface MediaSourceProps extends AuthorizableObject {
	id: string;

	name?: string;

	sourceId: string;

	oauthConfig?: MediaSourceOauthConfig;

	basicConfig?: MediaSourceBasicConfig;

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

	get basicConfig(): MediaSourceBasicConfig | undefined {
		return this.props.basicConfig;
	}
}
