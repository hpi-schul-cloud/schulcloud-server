export class ExternalToolLogo {
	logo: Buffer;

	contentType: string;

	constructor(externalToolLogo: ExternalToolLogo) {
		this.logo = externalToolLogo.logo;
		this.contentType = externalToolLogo.contentType;
	}
}
