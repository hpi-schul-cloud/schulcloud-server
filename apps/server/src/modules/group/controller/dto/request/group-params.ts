import { ApiPropertyOptional } from '@nestjs/swagger';
import { StringToBoolean } from '@shared/controller';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class GroupParams {
	@IsOptional()
	@IsBoolean()
	@StringToBoolean()
	@ApiPropertyOptional({ description: 'if true only available groups for a course sync are returned.' })
	availableGroupsForCourseSync?: boolean;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ description: 'search string for firstnames or lastnames' })
	nameQuery?: string;
}
