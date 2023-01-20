import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CustomParameterEntryParam {
	@IsString()
	@ApiProperty()
	name!: string;

	@IsString()
	@ApiProperty()
	value!: string;
}
