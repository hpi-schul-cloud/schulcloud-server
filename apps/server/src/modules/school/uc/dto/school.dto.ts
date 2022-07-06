import { EntityId } from '@shared/domain';

export class SchoolDto {
	constructor(schoolDto: SchoolDto) {
		this.id = schoolDto.id;
		this.name = schoolDto.name;
	}

	id?: EntityId;

	name: string;
}
