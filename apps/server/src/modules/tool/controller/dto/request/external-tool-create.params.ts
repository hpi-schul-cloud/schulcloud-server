import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ExternalToolConfigCreateParams {}

class CustomParameterCreateParams {}

export class ExternalToolParams {
	@IsString()
	@ApiProperty()
	name!: string;

	@IsString()
	@ApiProperty()
	url!: string;

	@IsString()
	@ApiProperty()
	logoUrl?: string;

	@ApiProperty()
	config!: ExternalToolConfigCreateParams;

	@ApiProperty()
	parameters?: CustomParameterCreateParams[];

	@IsBoolean()
	@ApiProperty()
	isHidden!: boolean;

	@IsBoolean()
	@ApiProperty()
	openNewTab!: boolean;

	@ApiProperty()
	version!: number;
}
