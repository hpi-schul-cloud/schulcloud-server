import { UserLicense, UserLicenseProps } from './user-license';

export interface MediaUserLicenseProps extends UserLicenseProps {
	mediumId: string;

	mediaSourceId?: string;
}

export class MediaUserLicense extends UserLicense<MediaUserLicenseProps> {
	get mediumId(): string {
		return this.props.mediumId;
	}

	set mediumId(value: string) {
		this.props.mediumId = value;
	}

	get mediaSourceId(): string | undefined {
		return this.props.mediaSourceId;
	}

	set mediaSourceId(value: string | undefined) {
		this.props.mediaSourceId = value;
	}
}
