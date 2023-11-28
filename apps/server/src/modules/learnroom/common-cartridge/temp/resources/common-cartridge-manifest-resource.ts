import { Builder } from 'xml2js';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';

type CommonCartridgeManifestElementProps = {
	version: CommonCartridgeVersion;
	metadata: CommonCartridgeElement;
	organizations: CommonCartridgeElement[];
	resources: CommonCartridgeElement[];
};

export class CommonCartridgeManifestResource implements CommonCartridgeResource {
	private readonly xmlBuilder = new Builder();

	constructor(private readonly props: CommonCartridgeManifestElementProps) {}

	canInline(): boolean {
		return false;
	}

	getFilePath(): string {
		return 'imsmanifest.xml';
	}

	getFileContent(): string {
		return this.xmlBuilder.buildObject(this.getManifestXml());
	}

	getManifestXml(): Record<string, unknown> | undefined {
		throw new Error('Method not implemented.');
	}
}
