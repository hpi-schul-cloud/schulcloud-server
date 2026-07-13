import { type EntityId } from '@shared/domain/types';

export class ParentConsent {
	public id: EntityId;

	public form: string;

	public privacyConsent: boolean;

	public termsOfUseConsent: boolean;

	public dateOfPrivacyConsent: Date;

	public dateOfTermsOfUseConsent: Date;

	constructor(props: ParentConsent) {
		this.id = props.id;
		this.form = props.form;
		this.privacyConsent = props.privacyConsent;
		this.termsOfUseConsent = props.termsOfUseConsent;
		this.dateOfPrivacyConsent = props.dateOfPrivacyConsent;
		this.dateOfTermsOfUseConsent = props.dateOfTermsOfUseConsent;
	}
}
