import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RenameFileData {
	@ApiProperty()
	@IsString()
	fileName!: string;
}
