import { MediaSource } from '@modules/media-source';
import { SchoolLicense, SchoolLicenseProps } from './school-license';

export interface MediaSchoolLicenseProps extends SchoolLicenseProps {
	mediumId: string;

	mediaSource?: MediaSource;
}

export class MediaSchoolLicense extends SchoolLicense<MediaSchoolLicenseProps> {
	get mediumId(): string {
		return this.props.mediumId;
	}

	get mediaSource(): MediaSource | undefined {
		return this.props.mediaSource;
	}
}
