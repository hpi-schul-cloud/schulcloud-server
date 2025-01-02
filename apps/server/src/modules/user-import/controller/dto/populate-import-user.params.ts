import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class PopulateImportUserParams {
	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional({
		description:
			'Should the users preferred name from the external system be used for auto-matching to existing users?',
	})
	public matchByPreferredName?: boolean;
}
