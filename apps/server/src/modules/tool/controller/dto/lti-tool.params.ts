import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LtiToolParams {
	@IsOptional()
	@IsString()
	@ApiProperty()
	name?: string;

	@IsOptional()
	@IsBoolean()
	@ApiProperty()
	isTemplate?: boolean;

	@IsOptional()
	@IsBoolean()
	@ApiProperty()
	isHidden?: boolean;

	constructor(props: LtiToolParams) {
		this.name = props.name;
		this.isTemplate = props.isTemplate;
		this.isHidden = props.isHidden;
	}
}
