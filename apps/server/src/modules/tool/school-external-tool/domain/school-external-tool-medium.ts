import { MediaSourceLicenseType } from '@modules/media-source';
import { ExternalToolMediumStatus } from '../../external-tool/enum';

export class SchoolExternalToolMedium {
	public status: ExternalToolMediumStatus;

	public mediumId?: string;

	public mediaSourceId?: string;

	public mediaSourceName?: string;

	public mediaSourceLicenseType?: MediaSourceLicenseType;

	constructor(props: SchoolExternalToolMedium) {
		this.status = props.status;
		this.mediaSourceName = props.mediaSourceName;
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
		this.mediaSourceLicenseType = props.mediaSourceLicenseType;
	}
}
