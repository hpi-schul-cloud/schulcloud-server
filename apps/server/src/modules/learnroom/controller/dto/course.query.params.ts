import { CommonCartridgeVersion } from '@modules/common-cartridge';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class CourseQueryParams {
	@IsString()
	@Matches(Object.values(CommonCartridgeVersion).join('|'))
	@ApiProperty({
		description: 'The version of CC export',
		required: true,
		nullable: false,
		enum: CommonCartridgeVersion,
	})
	version!: CommonCartridgeVersion;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'The ids of topics which should be exported separated by a comma.',
	})
	topics?: string;
}
