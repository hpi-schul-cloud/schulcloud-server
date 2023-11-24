import AdmZip from 'adm-zip';
import { Builder } from 'xml2js';
import { CommonCartridgeVersion } from '../common-cartridge.enums';

type CommonCartridgeFileBuilderOptions = {
	version: CommonCartridgeVersion;
};

const DEFAULT_OPTIONS: CommonCartridgeFileBuilderOptions = {
	version: CommonCartridgeVersion.V_1_3,
};

export class CommonCartridgeFileBuilder {
	private readonly archive: AdmZip = new AdmZip();

	private readonly xmlBuilder: Builder = new Builder();

	constructor(private readonly options: CommonCartridgeFileBuilderOptions) {
		Object.assign(this.options, DEFAULT_OPTIONS, options);
	}

	public build(): Promise<Buffer> {
		this.archive.addFile('imsmanifest.xml', Buffer.from(''));

		return Promise.resolve(this.archive.toBuffer());
	}
}
