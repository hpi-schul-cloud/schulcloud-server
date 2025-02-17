import { MediaSourceLicenseType } from '@modules/media-source';

export class SchoolExternalToolMedium {
	public mediumId: string;

	public mediaSourceId?: string;

	public mediaSourceName?: string;

	public mediaSourceLicenseType?: MediaSourceLicenseType;

	constructor(props: SchoolExternalToolMedium) {
		this.mediaSourceName = props.mediaSourceName;
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
		this.mediaSourceLicenseType = props.mediaSourceLicenseType;
	}
}
