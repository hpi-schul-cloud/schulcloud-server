import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExternalToolMediumMetadataResponse {
	@ApiProperty({ type: String, description: 'The Name of the Medium' })
	name: string;

	@ApiPropertyOptional({ type: String, description: 'The Description of the Medium' })
	description?: string;

	@ApiPropertyOptional({ type: String, description: 'The Publisher of the Medium' })
	publisher?: string;

	@ApiPropertyOptional({ type: String, description: 'The Logo URL of the Medium' })
	logoUrl?: string;

	@ApiPropertyOptional({ type: String, description: 'The Preview Logo URL of the Medium' })
	previewLogoUrl?: string;

	@ApiPropertyOptional({ type: Date, description: 'The last Modified Date of the Medium' })
	modifiedAt?: Date;

	constructor(response: ExternalToolMediumMetadataResponse) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modifiedAt = response.modifiedAt;
	}
}
