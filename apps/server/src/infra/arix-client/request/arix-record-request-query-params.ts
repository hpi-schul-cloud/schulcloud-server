import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ArixRecordRequestQueryParams {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description:
			'The representation in which the record should be displayed. "plain" outputs it in xml format. "edmond-superplain" outputs it in html format.',
	})
	template?: string;
}
