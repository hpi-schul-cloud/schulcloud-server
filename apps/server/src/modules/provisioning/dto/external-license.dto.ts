export class ExternalLicenseDto {
	mediumId: string;

	mediaSourceId?: string;

	constructor(props: ExternalLicenseDto) {
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
	}
}
