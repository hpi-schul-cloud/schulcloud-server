import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetH5PLibraryFileParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	ubername!: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	file!: string;
}
