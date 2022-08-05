import { EntityId } from '@shared/domain';

export class SchoolDto {
	constructor(schoolDto: SchoolDto) {
		this.id = schoolDto.id;
		this.name = schoolDto.name;
		this.externalSchoolId = schoolDto.externalSchoolId;
	}

	id?: EntityId;

	name: string;

	externalSchoolId?: string;
}
