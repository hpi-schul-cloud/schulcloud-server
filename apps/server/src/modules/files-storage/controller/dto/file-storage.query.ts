import { IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExpiresQuery {
	@IsDateString()
	@ApiPropertyOptional({
		description:
			'A optional query to modified the final deletion. Default is used the current date. After a 7 days offset the file is final removed.',
	})
	expires: Date = new Date(); // do this work with mapping from datestring to date?
}
