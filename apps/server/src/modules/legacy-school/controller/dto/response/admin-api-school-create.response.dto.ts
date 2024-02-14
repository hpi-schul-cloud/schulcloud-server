import { ApiProperty } from '@nestjs/swagger';

export class AdminApiSchoolCreateResponseDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	constructor(props: AdminApiSchoolCreateResponseDto) {
		this.id = props.id;
		this.name = props.name;
	}
}
