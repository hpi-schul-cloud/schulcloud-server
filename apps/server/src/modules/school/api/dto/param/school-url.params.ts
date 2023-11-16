import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SchoolUrlParams {
	@IsMongoId()
	@ApiProperty()
	schoolId!: string;
}
