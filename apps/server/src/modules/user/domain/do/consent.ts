import { ParentConsent } from './parent-consent';
import { UserConsent } from './user-consent';

export class Consent {
	userConsent: UserConsent;

	parentConsent: ParentConsent[];

	constructor(props: Consent) {
		this.userConsent = props.userConsent;
		this.parentConsent = props.parentConsent;
	}
}
