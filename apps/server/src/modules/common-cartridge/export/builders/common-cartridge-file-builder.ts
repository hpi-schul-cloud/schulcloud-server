import AdmZip from 'adm-zip';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import {
	CommonCartridgeElementFactory,
	CommonCartridgeElementProps,
} from '../elements/common-cartridge-element-factory';
import { CommonCartridgeElement, CommonCartridgeResource } from '../interfaces';
import { CommonCartridgeResourceFactory } from '../resources/common-cartridge-resource-factory';
import { OmitVersion } from '../utils';
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

	constructor(private readonly props: CommonCartridgeFileBuilderProps) {}

	public addMetadata(props: CommonCartridgeElementProps): CommonCartridgeFileBuilder {
		this.metadata = CommonCartridgeElementFactory.createElement({
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
			(resource: CommonCartridgeResource) => this.resources.push(resource)
		);

		this.organizationBuilders.push(builder);

		return builder;
	}

	public async build(): Promise<Buffer> {
		if (!this.metadata) {
			throw new Error('Metadata is not defined');
		}

		const organizations = this.organizationBuilders.map((builder) => builder.build());
		const manifest = CommonCartridgeResourceFactory.createResource({
			type: CommonCartridgeResourceType.MANIFEST,
			version: this.props.version,
			identifier: this.props.identifier,
			metadata: this.metadata,
			organizations,
			resources: this.resources,
		});

		for (const resources of this.resources) {
			if (!resources.canInline()) {
				this.archive.addFile(resources.getFilePath(), Buffer.from(resources.getFileContent()));
			}
		}

		this.archive.addFile(manifest.getFilePath(), Buffer.from(manifest.getFileContent()));

		const buffer = await this.archive.toBufferPromise();

		return buffer;
	}
}
