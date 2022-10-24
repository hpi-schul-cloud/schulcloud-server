import { EntityId } from '@shared/domain';

/**
 * Own provisioning class for a {@link SchoolDto}.
 */
export class ProvisioningSchoolOutputDto {
	constructor(schoolDto: ProvisioningSchoolOutputDto) {
		this.id = schoolDto.id;
		this.name = schoolDto.name;
		this.externalId = schoolDto.externalId;
		this.systemIds = schoolDto.systemIds;
	}

	id?: EntityId;

	name: string;

	externalId: string;

	systemIds: EntityId[];
}
