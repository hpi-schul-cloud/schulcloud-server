import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsBoolean, IsOptional } from 'class-validator';

export class GroupParams {
	@IsOptional()
	@ApiPropertyOptional({ default: false, required: false })
	@IsBoolean()
	availableSyncedGroups?: boolean;
}
