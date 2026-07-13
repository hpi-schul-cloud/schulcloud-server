import { type MediaSource, type MediumIdentifier } from '@modules/media-source';
import { SchoolLicense, type SchoolLicenseProps } from './school-license';

export interface MediaSchoolLicenseProps extends SchoolLicenseProps, MediumIdentifier {}

export class MediaSchoolLicense extends SchoolLicense<MediaSchoolLicenseProps> {
	get mediumId(): string {
		return this.props.mediumId;
	}

	get mediaSource(): MediaSource | undefined {
		return this.props.mediaSource;
	}
}
