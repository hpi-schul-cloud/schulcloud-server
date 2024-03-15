import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean } from 'class-validator';

export class GroupParams {
	@ApiProperty({ default: false })
	@IsBoolean()
	availableSyncedGroups!: boolean;
}
