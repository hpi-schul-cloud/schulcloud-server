import { MediaSource } from '@src/modules/media-source/domain';
import { SchoolLicense, SchoolLicenseProps } from './school-license';

export interface MediaSchoolLicenseProps extends SchoolLicenseProps {
	mediumId: string;

	mediaSource?: MediaSource;
}

export class MediaSchoolLicense extends SchoolLicense<MediaSchoolLicenseProps> {
	get mediumId(): string {
		return this.props.mediumId;
	}

	set mediumId(value: string) {
		this.props.mediumId = value;
	}

	get mediaSource(): MediaSource | undefined {
		return this.props.mediaSource;
	}

	set mediaSource(value: MediaSource) {
		this.props.mediaSource = value;
	}
}
