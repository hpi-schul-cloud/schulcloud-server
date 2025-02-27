import { MediaSource, MediumIdentifier } from '@modules/media-source';
import { UserLicense, UserLicenseProps } from './user-license';

export interface MediaUserLicenseProps extends UserLicenseProps, MediumIdentifier {}

export class MediaUserLicense extends UserLicense<MediaUserLicenseProps> {
	get mediumId(): string {
		return this.props.mediumId;
	}

	set mediumId(value: string) {
		this.props.mediumId = value;
	}

	get mediaSource(): MediaSource | undefined {
		return this.props.mediaSource;
	}
}
