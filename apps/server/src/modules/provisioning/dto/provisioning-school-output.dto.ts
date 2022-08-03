import { EntityId } from '@shared/domain';

/**
 * Own provisioning class for a {@link SchoolDto}.
 */
export class ProvisioningSchoolOutputDto {
	constructor(schoolDto: ProvisioningSchoolOutputDto) {
		this.id = schoolDto.id;
		this.name = schoolDto.name;
		this.externalIdentifier = schoolDto.externalIdentifier;
	}

	id?: EntityId;

	name: string;

	externalIdentifier?: string;
}
