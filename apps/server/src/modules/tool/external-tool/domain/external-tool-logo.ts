export class ExternalToolLogo {
	public logo: Buffer;

	public contentType: string;

	constructor(externalToolLogo: ExternalToolLogo) {
		this.logo = externalToolLogo.logo;
		this.contentType = externalToolLogo.contentType;
	}
}
