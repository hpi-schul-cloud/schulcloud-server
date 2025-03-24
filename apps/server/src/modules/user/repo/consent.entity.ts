import { Embeddable, Embedded } from '@mikro-orm/core';
import { ParentConsentEntity } from './parent-consent.entity';
import { UserConsentEntity } from './user-consent.entity';

@Embeddable()
export class ConsentEntity {
	@Embedded(() => UserConsentEntity, { nullable: true, object: true })
	userConsent?: UserConsentEntity;

	@Embedded(() => ParentConsentEntity, { array: true, nullable: true, object: true })
	parentConsents?: ParentConsentEntity[];

	constructor(props: ConsentEntity) {
		this.userConsent = props.userConsent;
		this.parentConsents = props.parentConsents;
	}
}
