import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LibraryFileUrlParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	ubername!: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	file!: string;
}
