import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeMetadataElement } from '../elements/common-cartridge-metadata-element';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

export class CommonCartridgeMetadataBuilder {
	private version = CommonCartridgeVersion.V_1_1;

	private title = '';

	private copyrightOwners: string[] = [];

	private creationDate: Date = new Date();

	public setVersion(version: CommonCartridgeVersion): CommonCartridgeMetadataBuilder {
		this.version = version;

		return this;
	}

	public setTitle(title: string): CommonCartridgeMetadataBuilder {
		this.title = title;

		return this;
	}

	public setCopyrightOwners(copyrightOwners: string[]): CommonCartridgeMetadataBuilder {
		this.copyrightOwners = copyrightOwners;

		return this;
	}

	public setCreationDate(creationDate: Date): CommonCartridgeMetadataBuilder {
		this.creationDate = creationDate;

		return this;
	}

	public build(): CommonCartridgeElement {
		return new CommonCartridgeMetadataElement({
			version: this.version,
			title: this.title,
			copyrightOwners: this.copyrightOwners,
			creationDate: this.creationDate,
		});
	}
}
