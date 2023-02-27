import { ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller';
import { IsBoolean, IsOptional } from 'class-validator';

export class DashboardParams {
	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional({
		description: 'Flag that indicates if the substitute courses should be shown',
	})
	showSubstitute?: boolean;
}
