import { EntityId, RoleName } from '@shared/domain';

/**
 * Own provisioning class for a {@link UserDto}.
 */
export class ProvisioningUserOutputDto {
	constructor(user: ProvisioningUserOutputDto) {
		this.id = user.id;
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.roleNames = user.roleNames;
		this.schoolId = user.schoolId;
		this.externalId = user.externalId;
	}

	id?: EntityId;

	firstName: string;

	lastName: string;

	roleNames: RoleName[];

	schoolId: EntityId;

	externalId: string;
}
