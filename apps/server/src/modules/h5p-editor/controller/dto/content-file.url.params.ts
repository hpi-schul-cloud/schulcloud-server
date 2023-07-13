import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class ContentFileUrlParams {
	@ApiProperty()
	@IsMongoId()
	id!: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	file!: string;
}
