import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional } from 'class-validator';

export class Lti11DeepLinkContentItemDurationParams {
	@IsOptional()
	@IsDate()
	@ApiPropertyOptional()
	startDatetime?: Date;

	@IsOptional()
	@IsDate()
	@ApiPropertyOptional()
	endDatetime?: Date;
}
