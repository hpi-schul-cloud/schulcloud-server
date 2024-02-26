import { ApiProperty } from '@nestjs/swagger';
import { CommonCartridgeVersion } from '@src/modules/common-cartridge/export';
import { IsString, Matches } from 'class-validator';

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
}
