import { EntityId } from '@shared/domain';

export class SchoolDto {
	constructor(schoolDto: SchoolDto) {
		this.id = schoolDto.id;
		this.name = schoolDto.name;
		this.externalIdentifier = schoolDto.externalIdentifier;
	}

	id?: EntityId;

	name: string;

	externalIdentifier?: string;
}
