import { ApiProperty } from '@nestjs/swagger';

export class ClassResponse {
	@ApiProperty()
	public name!: string;

	@ApiProperty()
	public gradeLevel!: number;

	@ApiProperty()
	public yearName!: string;
}
