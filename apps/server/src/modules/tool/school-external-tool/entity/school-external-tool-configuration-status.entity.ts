import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class SchoolExternalToolConfigurationStatusEntity {
	@Property()
	isOutdatedOnScopeSchool: boolean;

	@Property()
	isDeactivated: boolean;

	constructor(props: SchoolExternalToolConfigurationStatusEntity) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isDeactivated = props.isDeactivated;
	}
}
