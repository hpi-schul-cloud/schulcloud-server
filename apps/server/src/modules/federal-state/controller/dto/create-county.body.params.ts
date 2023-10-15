import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { IsNumber, IsString } from 'class-validator';

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
	countyId!: number;

	@IsString()
	@DecodeHtmlEntities()
	@ApiPropertyOptional({
		description: 'Antares key of the county',
		type: String,
	})
	antaresKey?: string;
}
