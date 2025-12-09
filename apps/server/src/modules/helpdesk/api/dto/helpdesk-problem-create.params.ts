import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { HelpdeskProblemType, SupportType } from '../../domain/type';

export class HelpdeskProblemCreateParams {
	@ApiProperty()
	@IsString()
	subject!: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	notes?: string;

	@ApiProperty({ enum: HelpdeskProblemType, required: false })
	@IsOptional()
	@IsEnum(HelpdeskProblemType)
	type?: HelpdeskProblemType;

	@ApiProperty({ enum: SupportType, required: false })
	@IsOptional()
	@IsEnum(SupportType)
	supportType?: SupportType;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsEmail()
	replyEmail?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	problemDescription?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	title?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsArray()
	files?: unknown[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	device?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	deviceUserAgent?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	browserName?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	browserVersion?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	os?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	problemArea?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	role?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	desire?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	benefit?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	acceptanceCriteria?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	cloud?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	schoolName?: string;
}
