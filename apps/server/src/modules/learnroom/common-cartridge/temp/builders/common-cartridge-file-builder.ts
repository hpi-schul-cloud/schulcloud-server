import AdmZip from 'adm-zip';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeMetadataBuilder } from './common-cartridge-metadata-builder';
import { CommonCartridgeOrganizationBuilder } from './common-cartridge-organization-builder';
import { CommonCartridgeManifestBuilder } from './common-cartridge-manifest-builder';
import { checkCommonCartridgeVersion, isCommonCartridgeResource, checkDefined } from '../utils';

export class CommonCartridgeFileBuilder {
	private identifier?: string;

	private readonly archive: AdmZip;

	private readonly metadataBuilder: CommonCartridgeMetadataBuilder;

	private readonly organizationBuilders: CommonCartridgeOrganizationBuilder[];

	constructor(private readonly version: CommonCartridgeVersion) {
		checkCommonCartridgeVersion(version);

		this.archive = new AdmZip();
		this.metadataBuilder = new CommonCartridgeMetadataBuilder(version);
		this.organizationBuilders = [];
	}

	setIdentifier(identifier: string): CommonCartridgeFileBuilder {
		this.identifier = identifier;

		return this;
	}

	withMetadata(): CommonCartridgeMetadataBuilder {
		return this.metadataBuilder;
	}

	withOrganization(): CommonCartridgeOrganizationBuilder {
		const builder = new CommonCartridgeOrganizationBuilder(this.version);

		this.organizationBuilders.push(builder);

		return builder;
	}

	build(): Promise<Buffer> {
		const identifier = checkDefined(this.identifier, 'Identifier');
		const metadata = this.metadataBuilder.build();
		const organizations = this.organizationBuilders.map((builder) => builder.build());
		const manifest = new CommonCartridgeManifestBuilder(this.version)
			.setIdentifier(identifier)
			.setMetadata(metadata)
			.setOrganizations(organizations)
			.build();

		for (const organization of organizations) {
			if (isCommonCartridgeResource(organization) && !organization.canInline()) {
				this.archive.addFile(organization.getFilePath(), Buffer.from(organization.getFileContent()));
			}
		}

		this.archive.addFile(manifest.getFilePath(), Buffer.from(manifest.getFileContent()));

		return this.archive.toBufferPromise();
	}
}
