import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommonCartridgeVersion } from '../../export/common-cartridge.enums';

export class CourseQueryParams {
	@IsString()
	@Matches(Object.values(CommonCartridgeVersion).join('|'))
	@ApiProperty({
		description: 'The version of CC export',
		nullable: false,
		enum: CommonCartridgeVersion,
	})
	public readonly version!: CommonCartridgeVersion;
}
