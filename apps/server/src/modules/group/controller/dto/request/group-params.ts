import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsBoolean } from 'class-validator';

export class GroupParams {
	@IsBoolean()
	@ApiPropertyOptional()
	availableSyncedGroups?: boolean;
}
