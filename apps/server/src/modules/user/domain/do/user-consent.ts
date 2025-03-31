export class UserConsent {
	public form: string;

	public privacyConsent: boolean;

	public termsOfUseConsent: boolean;

	public dateOfPrivacyConsent: Date;

	public dateOfTermsOfUseConsent: Date;

	constructor(props: UserConsent) {
		this.form = props.form;
		this.privacyConsent = props.privacyConsent;
		this.termsOfUseConsent = props.termsOfUseConsent;
		this.dateOfPrivacyConsent = props.dateOfPrivacyConsent;
		this.dateOfTermsOfUseConsent = props.dateOfTermsOfUseConsent;
	}
}
