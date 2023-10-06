import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassRootType } from '../../../uc/dto/class-root-type';

export class ClassInfoResponse {
	@ApiProperty()
	id: string;

	@ApiProperty({ enum: ClassRootType })
	type: ClassRootType;

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
		this.type = props.type;
		this.name = props.name;
		this.externalSourceName = props.externalSourceName;
		this.teachers = props.teachers;
		this.schoolYear = props.schoolYear;
	}
}
