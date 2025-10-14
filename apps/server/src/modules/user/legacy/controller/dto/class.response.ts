import { ApiProperty } from '@nestjs/swagger';

export class ClassResponse {
	@ApiProperty()
	public name!: string;

	@ApiProperty()
	public gradeLevel!: string;

	@ApiProperty()
	public yearName!: string;
}
