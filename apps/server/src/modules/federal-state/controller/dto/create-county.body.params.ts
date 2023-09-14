import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCountyBodyParams {
	@IsString()
	@DecodeHtmlEntities()
	@ApiProperty({
		description: 'Name of the county',
		required: true,
		type: String,
	})
	name!: string;

	@IsNumber()
	@ApiProperty({ description: 'Id of the federal state', type: Number, required: true })
	contyId!: number;

	@IsString()
	@DecodeHtmlEntities()
	@ApiProperty({
		description: 'Antares key of the county',
		required: true,
		type: String,
	})
	antaresKey!: string;
}
