import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class SchoolExternalToolParams {
	@ApiProperty()
	@IsString()
	@IsMongoId()
	schoolId!: string;
}
