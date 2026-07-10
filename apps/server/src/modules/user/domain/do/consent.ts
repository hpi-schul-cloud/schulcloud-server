import { type ParentConsent } from './parent-consent';
import { type UserConsent } from './user-consent';

export class Consent {
	public userConsent?: UserConsent;

	public parentConsents?: ParentConsent[];

	constructor(props: Consent) {
		this.userConsent = props.userConsent;
		this.parentConsents = props.parentConsents;
	}
}
