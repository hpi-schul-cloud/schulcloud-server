export class ExternalToolMediumMetadata {
	name: string;

	description: string | undefined;

	publisher: string | undefined;

	logoUrl: string | undefined;

	previewLogoUrl: string | undefined;

	modified: string | undefined;

	constructor(response: ExternalToolMediumMetadata) {
		this.name = response.name;
		this.description = response.description;
		this.publisher = response.publisher;
		this.logoUrl = response.logoUrl;
		this.previewLogoUrl = response.previewLogoUrl;
		this.modified = response.modified;
	}
}
