import { ApiProperty } from '@nestjs/swagger';

export class ClassResponse {
	@ApiProperty()
	name?: string;

	@ApiProperty()
	gradeLevel?: number;
}
