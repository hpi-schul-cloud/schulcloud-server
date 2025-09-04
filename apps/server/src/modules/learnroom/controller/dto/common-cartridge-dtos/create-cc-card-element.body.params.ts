import { UpdateElementContentBodyParams } from '@modules/board/controller/dto';
import { CommonCartridgeXmlResourceType } from '@modules/common-cartridge';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class CreateCcCardElementBodyParams {
	@ApiProperty({
		description: 'the card id of the card element',
		required: true,
	})
	@IsString()
	public cardId!: string;

	@ApiProperty({
		description: 'the type of the card element',
		required: true,
	})
	@IsEnum(CommonCartridgeXmlResourceType)
	public type!: CommonCartridgeXmlResourceType;

	@ApiProperty({
		description: 'the data of the card element',
		required: true,
	})
	public data!: UpdateElementContentBodyParams;
}
