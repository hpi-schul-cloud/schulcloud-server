import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsBoolean, IsOptional } from 'class-validator';

export class GroupParams {
	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional()
	availableSyncedGroups?: boolean;
}
