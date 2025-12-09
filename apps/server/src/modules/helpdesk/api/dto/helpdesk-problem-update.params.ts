import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { HelpdeskProblemState } from '../../domain/type';

export class HelpdeskProblemUpdateParams {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	subject?: string;

	@ApiProperty({ enum: HelpdeskProblemState, required: false })
	@IsOptional()
	@IsEnum(HelpdeskProblemState)
	state?: HelpdeskProblemState;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	notes?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	currentState?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	targetState?: string;
}
