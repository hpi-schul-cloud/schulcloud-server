import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolMediumMetadataResponse {
	@ApiProperty({ type: String, description: 'The Name of the Medium' })
	name: string;

	@ApiProperty({ type: String, description: 'The Description of the Medium' })
	description: string | undefined;

	@ApiProperty({ type: String, description: 'The Publisher of the Medium' })
	publisher: string | undefined;

	@ApiProperty({ type: String, description: 'The Logo URL of the Medium' })
	logoUrl: string | undefined;

	@ApiProperty({ type: String, description: 'The Preview Logo URL of the Medium' })
	previewLogoUrl: string | undefined;

	@ApiProperty({ type: Date, description: 'The last Modified Date of the Medium' })
	modified: Date | undefined;

	constructor(response: ExternalToolMediumMetadataResponse) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modified = response.modified;
	}
}
