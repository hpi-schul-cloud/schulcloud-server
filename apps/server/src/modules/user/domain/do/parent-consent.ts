import { EntityId } from '@shared/domain/types';

export class ParentConsent {
	id: EntityId;

	form: string;

	privacyConsent: boolean;

	termsOfUseConsent: boolean;

	dateOfPrivacyConsent: Date;

	dateOfTermsOfUseConsent: Date;

	constructor(props: ParentConsent) {
		this.id = props.id;
		this.form = props.form;
		this.privacyConsent = props.privacyConsent;
		this.termsOfUseConsent = props.termsOfUseConsent;
		this.dateOfPrivacyConsent = props.dateOfPrivacyConsent;
		this.dateOfTermsOfUseConsent = props.dateOfTermsOfUseConsent;
	}
}
