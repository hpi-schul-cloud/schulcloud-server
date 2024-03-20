import { ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller';
import { IsBoolean, IsOptional } from 'class-validator';

export class GroupParams {
	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional({ description: 'if true only available groups for a course sync are returned.' })
	availableGroupsForCourseSync?: boolean;
}
