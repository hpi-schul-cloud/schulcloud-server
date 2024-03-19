import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsBoolean, IsOptional } from 'class-validator';

export class GroupParams {
	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional({ description: 'if true only available groups for a course sync are returned.' })
	availableGroupsForCourseSync?: boolean;
}
