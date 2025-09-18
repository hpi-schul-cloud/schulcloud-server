import { UpdateElementContentBodyParams } from '@modules/board/controller/dto';
import { CommonCartridgeXmlResourceType } from '@modules/common-cartridge';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class CreateCcCardElementBodyParams {
	@ApiPropertyOptional({
		description: 'the unique xml path of the card element',
		required: false,
	})
	@IsString()
	public xmlPath?: string;
	@ApiProperty({
		description: 'the type of the card element',
		required: true,
	})
	@IsEnum(CommonCartridgeXmlResourceType)
	public type!: CommonCartridgeXmlResourceType;

	@ApiProperty({
		description: 'the data of the card element',
		required: false,
	})
	public data?: UpdateElementContentBodyParams;
}
