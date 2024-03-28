import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SchoolRemoveSystemUrlParams {
	@IsMongoId()
	@ApiProperty()
	schoolId!: string;

	@IsMongoId()
	@ApiProperty()
	systemId!: string;
}
