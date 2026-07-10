import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { HelpdeskProblemProps, HelpdeskProps, HelpdeskWishProps, SupportType } from '../../domain';

class HelpdeskCreateParams implements HelpdeskProps {
	@ApiProperty({ enum: SupportType })
	@IsEnum(SupportType)
	supportType!: SupportType;

	@ApiProperty()
	@IsString()
	subject!: string;

	@ApiProperty()
	@IsEmail()
	replyEmail!: string;

	@ApiProperty()
	@IsString({ each: true })
	problemArea!: string[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	device?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsBoolean()
	consent?: boolean;
}

export class HelpdeskProblemCreateParams extends HelpdeskCreateParams implements HelpdeskProblemProps {
	@ApiProperty()
	@IsString()
	problemDescription!: string;
}

export class HelpdeskWishCreateParams extends HelpdeskCreateParams implements HelpdeskWishProps {
	@ApiProperty()
	@IsString()
	role!: string;

	@ApiProperty()
	@IsString()
	desire!: string;

	@ApiProperty()
	@IsString()
	benefit!: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	acceptanceCriteria?: string;
}
