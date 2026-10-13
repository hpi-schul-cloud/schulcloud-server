import { type MediaSource, type MediumIdentifier } from '@modules/media-source';
import { GroupLicense, type GroupLicenseProps } from './group-license';

export interface MediaGroupLicenseProps extends GroupLicenseProps, MediumIdentifier {}

export class MediaGroupLicense extends GroupLicense<MediaGroupLicenseProps> {
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
