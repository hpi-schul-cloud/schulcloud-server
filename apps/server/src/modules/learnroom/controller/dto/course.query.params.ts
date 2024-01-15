import { CommonCartridgeVersion } from '@modules/common-cartridge';
import { ApiProperty } from '@nestjs/swagger';
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
