import { ApiProperty } from '@nestjs/swagger';

export class GroupEntryResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	constructor(group: GroupEntryResponse) {
		this.id = group.id;
		this.name = group.name;
	}
}
