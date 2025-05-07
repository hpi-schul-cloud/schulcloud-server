import { Embeddable, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Embeddable()
export class ParentConsentEntity {
	@Property()
	_id: ObjectId;

	@Property()
	form: string;

	@Property()
	privacyConsent: boolean;

	@Property()
	termsOfUseConsent: boolean;

	@Property()
	dateOfPrivacyConsent: Date;

	@Property()
	dateOfTermsOfUseConsent: Date;

	constructor(props: ParentConsentEntity) {
		this._id = props._id;
		this.form = props.form;
		this.privacyConsent = props.privacyConsent;
		this.termsOfUseConsent = props.termsOfUseConsent;
		this.dateOfPrivacyConsent = props.dateOfPrivacyConsent;
		this.dateOfTermsOfUseConsent = props.dateOfTermsOfUseConsent;
	}
}
