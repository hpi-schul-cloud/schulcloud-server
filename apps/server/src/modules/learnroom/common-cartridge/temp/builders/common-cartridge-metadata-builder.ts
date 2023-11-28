import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeMetadataElement } from '../elements/common-cartridge-metadata-element';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

export class CommonCartridgeMetadataBuilder {
	private title = '';

	private copyrightOwners: string[] = [];

	private creationDate: Date = new Date();

	constructor(private readonly version: CommonCartridgeVersion) {}

	setTitle(title: string): CommonCartridgeMetadataBuilder {
		this.title = title;

		return this;
	}

	setCopyrightOwners(copyrightOwners: string[]): CommonCartridgeMetadataBuilder {
		this.copyrightOwners = copyrightOwners;

		return this;
	}

	setCreationDate(creationDate: Date): CommonCartridgeMetadataBuilder {
		this.creationDate = creationDate;

		return this;
	}

	build(): CommonCartridgeElement {
		return new CommonCartridgeMetadataElement({
			version: this.version,
			title: this.title,
			copyrightOwners: this.copyrightOwners,
			creationDate: this.creationDate,
		});
	}
}
