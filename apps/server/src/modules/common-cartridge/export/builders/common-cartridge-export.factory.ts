import AdmZip from 'adm-zip';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../common-cartridge.enums';
import {
	CommonCartridgeElementFactory,
	CommonCartridgeElementProps,
} from '../elements/common-cartridge-element-factory';
import { CommonCartridgeElement } from '../interfaces';
import { CommonCartridgeResourceFactory } from '../resources/common-cartridge-resource-factory';
import {
	CommonCartridgeOrganizationNode,
	CommonCartridgeOrganizationNodeProps,
} from './common-cartridge-organization-node';
import { CommonCartridgeResourcesBuilder } from './common-cartridge-resources-builder';

export type CommonCartridgeExportFactoryProps = {
	version: CommonCartridgeVersion;
	identifier: string;
};

export type CommonCartridgeOrganizationProps = Omit<CommonCartridgeOrganizationNodeProps, 'version' | 'type'>;

export class CommonCartridgeExportFactory {
	private readonly resourcesBuilder: CommonCartridgeResourcesBuilder = new CommonCartridgeResourcesBuilder();

	private readonly organizationsRoot: CommonCartridgeOrganizationNode[] = [];

	private metadataElement: CommonCartridgeElement | null = null;

	constructor(private readonly props: CommonCartridgeExportFactoryProps) {}

	public addMetadata(props: CommonCartridgeElementProps): void {
		this.metadataElement = CommonCartridgeElementFactory.createElement({
			version: this.props.version,
			...props,
		});
	}

	public createOrganization(organizationProps: CommonCartridgeOrganizationProps): CommonCartridgeOrganizationNode {
		const organization = new CommonCartridgeOrganizationNode(
			{ ...organizationProps, version: this.props.version, type: CommonCartridgeElementType.ORGANIZATION },
			this.resourcesBuilder,
			null
		);

		this.organizationsRoot.push(organization);

		return organization;
	}

	public build(): Buffer {
		if (!this.metadataElement) {
			throw new Error('Metadata is required');
		}

		const archive = new AdmZip();
		const organizations = this.organizationsRoot.map((organization) => organization.build());
		const resources = this.resourcesBuilder.build();
		const manifest = CommonCartridgeResourceFactory.createResource({
			type: CommonCartridgeResourceType.MANIFEST,
			version: this.props.version,
			identifier: this.props.identifier,
			metadata: this.metadataElement,
			organizations,
			resources,
		});

		archive.addFile('imsmanifest.xml', Buffer.from(manifest.getFileContent()));

		resources
			.filter((resource) => !resource.canInline())
			.forEach((resource) => {
				archive.addFile(resource.getFilePath(), Buffer.from(resource.getFileContent()));
			});

		return archive.toBuffer();
	}
}
