import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassInfoResponse {
	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	externalSourceName?: string;

	@ApiProperty({ type: [String] })
	teachers: string[];

	constructor(props: ClassInfoResponse) {
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teachers = props.teachers;
	}
}
