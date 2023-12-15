import AdmZip from 'adm-zip';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../elements/common-cartridge-element-factory';
import { CommonCartridgeMetadataElementPropsV110 } from '../elements/v1.1.0/common-cartridge-metadata-element';
import { CommonCartridgeMetadataElementPropsV130 } from '../elements/v1.3.0/common-cartridge-metadata-element';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { CommonCartridgeResourceFactory } from '../resources/common-cartridge-resource-factory';
import { OmitVersion, OmitVersionAndType, checkDefined } from '../utils';
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

	public constructor(private readonly props: CommonCartridgeFileBuilderProps) {}

	public addMetadata(
		props: OmitVersionAndType<CommonCartridgeMetadataElementPropsV110 | CommonCartridgeMetadataElementPropsV130>
	): CommonCartridgeFileBuilder {
		this.metadata = CommonCartridgeElementFactory.createElement({
			type: CommonCartridgeElementType.METADATA,
			version: this.props.version,
			...props,
		});

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
		const manifest = CommonCartridgeResourceFactory.createResource({
			type: CommonCartridgeResourceType.MANIFEST,
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
