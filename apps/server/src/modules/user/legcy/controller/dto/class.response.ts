import { ApiProperty } from '@nestjs/swagger';

export class ClassResponse {
	constructor({ name, gradeLevel }: ClassResponse) {
		this.name = name;
		this.gradeLevel = gradeLevel;
	}

	@ApiProperty()
	name: string;

	@ApiProperty()
	gradeLevel?: number;
}
