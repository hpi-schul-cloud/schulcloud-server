import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RenameFileDto {
	@ApiProperty()
	@IsString()
	fileName!: string;
}
