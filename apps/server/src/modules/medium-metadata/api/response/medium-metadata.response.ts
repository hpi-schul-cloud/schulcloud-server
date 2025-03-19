import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediumMetadataResponse {
	@ApiProperty({ type: String, description: 'The Name' })
	public name: string;

	@ApiPropertyOptional({ type: String, description: 'The Description' })
	public description?: string;

	@ApiPropertyOptional({ type: String, description: 'The Publisher' })
	public publisher?: string;

	@ApiPropertyOptional({ type: String, description: 'The Logo URL' })
	public logoUrl?: string;

	@ApiPropertyOptional({ type: String, description: 'The Preview Logo URL' })
	public previewLogoUrl?: string;

	@ApiPropertyOptional({ type: Date, description: 'The last Modified Date' })
	public modifiedAt?: Date;

	constructor(response: MediumMetadataResponse) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modifiedAt = response.modifiedAt;
	}
}
