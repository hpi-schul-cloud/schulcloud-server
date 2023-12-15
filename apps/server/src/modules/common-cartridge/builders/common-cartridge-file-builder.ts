import AdmZip from 'adm-zip';
import { CommonCartridgeVersion } from '../common-cartridge.enums';
import {
	CommonCartridgeMetadataElementPropsV110,
	CommonCartridgeMetadataElementV110,
} from '../elements/v1.1.0/common-cartridge-metadata-element';
import {
	CommonCartridgeMetadataElementPropsV130,
	CommonCartridgeMetadataElementV130,
} from '../elements/v1.3.0/common-cartridge-metadata-element';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { CommonCartridgeManifestResource } from '../resources/common-cartridge-manifest-resource';
import { OmitVersion, checkCommonCartridgeVersion, checkDefined } from '../utils';
import {
	CommonCartridgeOrganizationBuilder,
	CommonCartridgeOrganizationBuilderOptions,
} from './common-cartridge-organization-builder';

export type CommonCartridgeFileBuilderProps = {
	version: CommonCartridgeVersion;
	identifier: string;
};

export class CommonCartridgeFileBuilder {
	private readonly archive: AdmZip = new AdmZip();

	private readonly organizationBuilders = new Array<CommonCartridgeOrganizationBuilder>();

	private readonly resources = new Array<CommonCartridgeResource>();

	private metadata?: CommonCartridgeElement;

	public constructor(private readonly props: CommonCartridgeFileBuilderProps) {
		checkCommonCartridgeVersion(props.version);
	}

	public addMetadata(
		props: OmitVersion<CommonCartridgeMetadataElementPropsV110 | CommonCartridgeMetadataElementPropsV130>
	): CommonCartridgeFileBuilder {
		switch (this.props.version) {
			case CommonCartridgeVersion.V_1_1_0:
				this.metadata = new CommonCartridgeMetadataElementV110({ ...props, version: this.props.version });
				break;
			case CommonCartridgeVersion.V_1_3_0:
				this.metadata = new CommonCartridgeMetadataElementV130({ ...props, version: this.props.version });
				break;
			default:
				throw new Error('Version not supported');
		}
		// this.metadata = new CommonCartridgeMetadataElement({ ...props, version: this.props.version });

		return this;
	}

	public addOrganization(
		props: OmitVersion<CommonCartridgeOrganizationBuilderOptions>
	): CommonCartridgeOrganizationBuilder {
		const builder = new CommonCartridgeOrganizationBuilder(
			{ ...props, version: this.props.version },
			this.addResource.bind(this)
		);

		this.organizationBuilders.push(builder);

		return builder;
	}

	public build(): Promise<Buffer> {
		const metadata = checkDefined(this.metadata, 'metadata');
		const organizations = this.organizationBuilders.map((builder) => builder.build());
		const manifest = new CommonCartridgeManifestResource({
			version: this.props.version,
			identifier: this.props.identifier,
			metadata,
			organizations,
			resources: this.resources,
		});

		for (const resources of this.resources) {
			if (!resources.canInline()) {
				this.archive.addFile(resources.getFilePath(), Buffer.from(resources.getFileContent()));
			}
		}

		this.archive.addFile(manifest.getFilePath(), Buffer.from(manifest.getFileContent()));

		return this.archive.toBufferPromise();
	}

	private addResource(resource: CommonCartridgeResource): void {
		this.resources.push(resource);
	}
}
