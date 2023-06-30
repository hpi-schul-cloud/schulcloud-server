import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { CommonCartridgeVersion } from '../../common-cartridge';

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
