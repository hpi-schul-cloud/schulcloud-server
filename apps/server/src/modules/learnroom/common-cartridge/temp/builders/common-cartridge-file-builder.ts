import AdmZip from 'adm-zip';
import { Builder } from 'xml2js';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeManifestElement } from '../elements/common-cartridge-manifest-element';
import { CommonCartridgeMetadataBuilder } from './common-cartridge-metadata-builder';
import { CommonCartridgeOrganizationBuilder } from './common-cartridge-organization-builder';

type CommonCartridgeFileBuilderOptions = {
	version: CommonCartridgeVersion;
	title: string;
	copyrightOwners?: string[];
	creationDate?: Date;
};

const DEFAULT_OPTIONS: CommonCartridgeFileBuilderOptions = {
	version: CommonCartridgeVersion.V_1_1,
	title: '',
	copyrightOwners: [],
	creationDate: new Date(),
};

export class CommonCartridgeFileBuilder {
	private readonly archive = new AdmZip();

	private readonly xmlBuilder = new Builder();

	private readonly metadataBuilder = new CommonCartridgeMetadataBuilder();

	private readonly organizationBuilders = new Array<CommonCartridgeOrganizationBuilder>();

	public constructor(private readonly options: CommonCartridgeFileBuilderOptions) {
		Object.assign(this.options, DEFAULT_OPTIONS, options);
	}

	public withMetadata(): CommonCartridgeMetadataBuilder {
		return this.metadataBuilder;
	}

	public withOrganization(): CommonCartridgeOrganizationBuilder {
		const builder = new CommonCartridgeOrganizationBuilder();

		this.organizationBuilders.push(builder);

		return builder;
	}

	public build(): Promise<Buffer> {
		const metadata = this.metadataBuilder.build();
		const organizations = this.organizationBuilders.map((builder) => builder.build());
		const manifest = this.xmlBuilder.buildObject(new CommonCartridgeManifestElement({}).getManifestXml());

		for (const organization of organizations) {
			if (!organization.canInline()) {
				organization.addToArchive(this.archive);
			}
		}

		this.archive.addFile('imsmanifest.xml', Buffer.from(manifest));

		return Promise.resolve(this.archive.toBuffer());
	}
}
