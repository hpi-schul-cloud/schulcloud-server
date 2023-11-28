import AdmZip from 'adm-zip';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeMetadataBuilder } from './common-cartridge-metadata-builder';
import { CommonCartridgeOrganizationBuilder } from './common-cartridge-organization-builder';
import { CommonCartridgeManifestBuilder } from './common-cartridge-manifest-builder';

type CommonCartridgeFileBuilderOptions = {
	version: CommonCartridgeVersion;
};

const DEFAULT_OPTIONS: CommonCartridgeFileBuilderOptions = {
	version: CommonCartridgeVersion.V_1_1,
};

export class CommonCartridgeFileBuilder {
	private readonly archive = new AdmZip();

	private readonly metadataBuilder = new CommonCartridgeMetadataBuilder();

	private readonly organizationBuilders = new Array<CommonCartridgeOrganizationBuilder>();

	constructor(private readonly options: CommonCartridgeFileBuilderOptions) {
		Object.assign(this.options, DEFAULT_OPTIONS, options);
	}

	withMetadata(): CommonCartridgeMetadataBuilder {
		return this.metadataBuilder;
	}

	withOrganization(): CommonCartridgeOrganizationBuilder {
		const builder = new CommonCartridgeOrganizationBuilder();

		this.organizationBuilders.push(builder);

		return builder;
	}

	build(): Promise<Buffer> {
		const metadata = this.metadataBuilder.build();
		const organizations = this.organizationBuilders.map((builder) => builder.build());
		const manifest = new CommonCartridgeManifestBuilder(this.options.version)
			.setMetadata(metadata)
			.setOrganizations(organizations)
			.build();

		for (const organization of organizations) {
			if (!organization.canInline()) {
				this.archive.addFile(organization.getFilePath(), Buffer.from(organization.getFileContent()));
			}
		}

		this.archive.addFile(manifest.getFilePath(), Buffer.from(manifest.getFileContent()));

		return this.archive.toBufferPromise();
	}
}
