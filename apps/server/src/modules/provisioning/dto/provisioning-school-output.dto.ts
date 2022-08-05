import { EntityId } from '@shared/domain';

/**
 * Own provisioning class for a {@link SchoolDto}.
 */
export class ProvisioningSchoolOutputDto {
	constructor(schoolDto: ProvisioningSchoolOutputDto) {
		this.id = schoolDto.id;
		this.name = schoolDto.name;
		this.externalSchoolId = schoolDto.externalSchoolId;
	}

	id?: EntityId;

	name: string;

	externalSchoolId: string;
}
