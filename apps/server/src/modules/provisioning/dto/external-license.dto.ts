export type LicenseScope = 'USER' | 'GROUP' | 'SCHOOL';

export class ExternalLicenseDto {
	mediumId: string;

	mediaSourceId?: string;

	scope?: LicenseScope;

	scopeId?: string;

	licenseKey?: string;

	constructor(props: {
		mediumId: string;
		mediaSourceId?: string;
		scope?: LicenseScope;
		scopeId?: string;
		licenseKey?: string;
	}) {
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
		this.scope = props.scope ?? 'USER';
		this.scopeId = props.scopeId;
		this.licenseKey = props.licenseKey;
	}
}
