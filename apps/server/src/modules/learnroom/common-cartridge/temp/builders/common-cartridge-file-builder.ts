import AdmZip from 'adm-zip';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import {
	CommonCartridgeOrganizationBuilder,
	CommonCartridgeOrganizationBuilderOptions,
} from './common-cartridge-organization-builder';
import { checkCommonCartridgeVersion, isCommonCartridgeResource, checkDefined } from '../utils';
import { CommonCartridgeManifestResource } from '../resources/common-cartridge-manifest-resource';
import {
	CommonCartridgeMetadataElement,
	CommonCartridgeMetadataElementProps,
} from '../elements/common-cartridge-metadata-element';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';

export type CommonCartridgeFileBuilderProps = {
	version: CommonCartridgeVersion;
	identifier: string;
};

export class CommonCartridgeFileBuilder {
	private readonly archive: AdmZip = new AdmZip();

	private metadata?: CommonCartridgeElement;

	private readonly organizationBuilders: CommonCartridgeOrganizationBuilder[];

	constructor(private readonly props: CommonCartridgeFileBuilderProps) {
		checkCommonCartridgeVersion(props.version);

		this.organizationBuilders = [];
	}

	withMetadata(props: Omit<CommonCartridgeMetadataElementProps, 'version'>): CommonCartridgeFileBuilder {
		this.metadata = new CommonCartridgeMetadataElement({ ...props, version: this.props.version });

		return this;
	}

	withOrganization(
		props: Omit<CommonCartridgeOrganizationBuilderOptions, 'version'>
	): CommonCartridgeOrganizationBuilder {
		const builder = new CommonCartridgeOrganizationBuilder({ ...props, version: this.props.version });

		this.organizationBuilders.push(builder);

		return builder;
	}

	build(): Promise<Buffer> {
		const metadata = checkDefined(this.metadata, 'metadata');
		const organizations = this.organizationBuilders.map((builder) => builder.build());
		const manifest = new CommonCartridgeManifestResource({
			version: this.props.version,
			identifier: this.props.identifier,
			metadata,
			organizations,
			resources: [], // TODO: add resources
		});

		for (const organization of organizations) {
			if (isCommonCartridgeResource(organization) && !organization.canInline()) {
				this.archive.addFile(organization.getFilePath(), Buffer.from(organization.getFileContent()));
			}
		}

		this.archive.addFile(manifest.getFilePath(), Buffer.from(manifest.getFileContent()));

		return this.archive.toBufferPromise();
	}
}
