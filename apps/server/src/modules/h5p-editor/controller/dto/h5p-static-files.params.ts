import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetH5PStaticCoreFileParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	file!: string;
}

export class GetH5PStaticEditorCoreFileParams {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	ubername!: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	file!: string;
}
