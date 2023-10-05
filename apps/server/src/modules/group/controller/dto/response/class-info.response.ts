import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassInfoResponse {
	@ApiPropertyOptional()
	id?: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	externalSourceName?: string;

	@ApiProperty({ type: [String] })
	teachers: string[];

	@ApiPropertyOptional()
	schoolYear?: string;

	constructor(props: ClassInfoResponse) {
		this.id = props.id;
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teachers = props.teachers;
		this.schoolYear = props.schoolYear;
	}
}
