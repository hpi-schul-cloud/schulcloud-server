export class UserConsent {
	form: string;

	privacyConsent: boolean;

	termsOfUseConsent: boolean;

	dateOfPrivacyConsent: Date;

	dateOfTermsOfUseConsent: Date;

	constructor(props: UserConsent) {
		this.form = props.form;
		this.privacyConsent = props.privacyConsent;
		this.termsOfUseConsent = props.termsOfUseConsent;
		this.dateOfPrivacyConsent = props.dateOfPrivacyConsent;
		this.dateOfTermsOfUseConsent = props.dateOfTermsOfUseConsent;
	}
}
