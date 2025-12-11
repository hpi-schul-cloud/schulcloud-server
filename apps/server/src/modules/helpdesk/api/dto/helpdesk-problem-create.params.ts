import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { HelpdeskProblemProps, HelpdeskProps, HelpdeskWishProps, SupportType } from '../../domain';

export class HelpdeskCreateParams implements HelpdeskProps {
	@ApiProperty({ enum: SupportType })
	@IsEnum(SupportType)
	public supportType!: SupportType;

	@ApiProperty()
	@IsString()
	public subject!: string;

	@ApiProperty()
	@IsEmail()
	public replyEmail!: string;

	@ApiProperty()
	@IsString({ each: true })
	public problemArea!: string[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	public device?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsBoolean()
	public consent?: boolean;
}

export class HelpdeskProblemCreateParams extends HelpdeskCreateParams implements HelpdeskProblemProps {
	@ApiProperty()
	@IsString()
	public problemDescription!: string;
}

export class HelpdeskWishCreateParams extends HelpdeskCreateParams implements HelpdeskWishProps {
	@ApiProperty()
	@IsString()
	public role!: string;

	@ApiProperty()
	@IsString()
	public desire!: string;

	@ApiProperty()
	@IsString()
	public benefit!: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	public acceptanceCriteria?: string;
}
