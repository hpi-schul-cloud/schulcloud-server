import { EntityId } from '@shared/domain';

export class SchoolDto {
	constructor(schoolDto: SchoolDto) {
		this.id = schoolDto.id;
		this.name = schoolDto.name;
		this.externalId = schoolDto.externalId;
	}

	id?: EntityId;

	name: string;

	externalId?: string;
}
