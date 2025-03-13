import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExternalToolMediumMetadataResponse {
	@ApiProperty({ type: String, description: 'The Name of the Medium' })
	public name: string;

	@ApiPropertyOptional({ type: String, description: 'The Description of the Medium' })
	public description?: string;

	@ApiPropertyOptional({ type: String, description: 'The Publisher of the Medium' })
	public publisher?: string;

	@ApiPropertyOptional({ type: String, description: 'The Logo URL of the Medium' })
	public logoUrl?: string;

	@ApiPropertyOptional({ type: String, description: 'The Preview Logo URL of the Medium' })
	public previewLogoUrl?: string;

	@ApiPropertyOptional({ type: Date, description: 'The last Modified Date of the Medium' })
	public modifiedAt?: Date;

	constructor(response: ExternalToolMediumMetadataResponse) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modifiedAt = response.modifiedAt;
	}
}
