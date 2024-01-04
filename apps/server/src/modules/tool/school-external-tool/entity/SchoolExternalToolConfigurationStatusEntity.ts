import { Entity } from '@mikro-orm/core';

@Entity()
export class SchoolExternalToolConfigurationStatusEntity {
	isOutdatedOnScopeSchool: boolean;

	isDeactivated: boolean;

	constructor(props: SchoolExternalToolConfigurationStatusEntity) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isDeactivated = props.isDeactivated;
	}
}
