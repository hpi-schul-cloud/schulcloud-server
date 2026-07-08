import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediumMetadataResponse {
	@ApiProperty({ type: String, description: 'The Name' })
	name: string;

	@ApiPropertyOptional({ type: String, description: 'The Description' })
	description?: string;

	@ApiPropertyOptional({ type: String, description: 'The Publisher' })
	publisher?: string;

	@ApiPropertyOptional({ type: String, description: 'The Logo URL' })
	logoUrl?: string;

	@ApiPropertyOptional({ type: String, description: 'The Preview Logo URL' })
	previewLogoUrl?: string;

	@ApiPropertyOptional({ type: Date, description: 'The last Modified Date' })
	modifiedAt?: Date;

	constructor(response: MediumMetadataResponse) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modifiedAt = response.modifiedAt;
	}
}
