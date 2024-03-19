import { ApiProperty } from '@nestjs/swagger';
import { SystemType } from '@shared/domain/types';

export class SchoolSystemsResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	systems: SchoolSystemResponse[];

	constructor(props: SchoolSystemsResponse) {
		this.id = props.id;
		this.systems = props.systems;
	}
}

export class SchoolSystemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	type: SystemType;

	@ApiProperty()
	alias?: string;

	constructor(props: SchoolSystemResponse) {
		this.id = props.id;
		this.type = props.type;
		this.alias = props.alias;
	}
}
