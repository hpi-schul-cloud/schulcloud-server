import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ContentFileUrlParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	id!: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	file!: string;
}
