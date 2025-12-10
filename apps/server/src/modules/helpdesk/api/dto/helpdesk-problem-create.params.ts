import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { SupportType } from '../../domain/type';

export class HelpdeskCreateParams {
	@ApiProperty({ enum: SupportType })
	@IsEnum(SupportType)
	public supportType!: SupportType;

	@ApiProperty()
	@IsString()
	public subject!: string;

	@ApiProperty()
	@IsOptional()
	@IsEmail()
	public replyEmail!: string;

	@ApiProperty({ required: false })
	@IsOptional()
	public files?: Express.Multer.File[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsBoolean()
	public consent?: boolean;
}
export class HelpdeskProblemCreateParams extends HelpdeskCreateParams {
	@ApiProperty()
	@IsString({ each: true })
	public problemArea!: string[];

	@ApiProperty()
	@IsString()
	public description!: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	public device?: string;
}

export class HelpdeskWishCreateParams extends HelpdeskCreateParams {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	public desire?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	public benefit?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	public acceptanceCriteria?: string;
}
