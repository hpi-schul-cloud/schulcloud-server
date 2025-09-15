import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../common-cartridge.enums';
import {
	CommonCartridgeElementFactory,
	CommonCartridgeElementProps,
} from '../elements/common-cartridge-element-factory';
import { MissingMetadataLoggableException } from '../errors';
import { CommonCartridgeElement } from '../interfaces';
import { CommonCartridgeResourceFactory } from '../resources/common-cartridge-resource-factory';
import {
	CommonCartridgeOrganizationNode,
	CommonCartridgeOrganizationNodeProps,
} from './common-cartridge-organization-node';
import { CommonCartridgeResourceCollectionBuilder } from './common-cartridge-resource-collection-builder';

import archiver from 'archiver';

export type CommonCartridgeFileBuilderProps = {
	version: CommonCartridgeVersion;
	identifier: string;
};

export type CommonCartridgeOrganizationProps = Omit<CommonCartridgeOrganizationNodeProps, 'version' | 'type'>;

export class CommonCartridgeFileBuilder {
	private readonly resourcesBuilder: CommonCartridgeResourceCollectionBuilder =
		new CommonCartridgeResourceCollectionBuilder();

	private readonly organizationsRoot: CommonCartridgeOrganizationNode[] = [];

	private metadataElement: CommonCartridgeElement | null = null;

	constructor(private readonly props: CommonCartridgeFileBuilderProps) {}

	public addMetadata(metadataProps: CommonCartridgeElementProps): void {
		this.metadataElement = CommonCartridgeElementFactory.createElement({
			version: this.props.version,
			...metadataProps,
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

	public build(archive: archiver.Archiver): void {
		if (!this.metadataElement) {
			throw new MissingMetadataLoggableException();
		}

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

		archive.append(Buffer.from(manifest.getFileContent()), { name: manifest.getFilePath() });

		resources.forEach((resource) => {
			const fileContent = resource.getFileContent();
			const buffer = Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent);

			archive.append(buffer, { name: resource.getFilePath() });
		});
	}
}
