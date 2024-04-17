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
import { CommonCartridgeOrganizationElementPropsV110 } from '../elements/v1.1.0';
import { CommonCartridgeOrganizationElementPropsV130 } from '../elements/v1.3.0';
import { CommonCartridgeElement, CommonCartridgeResource } from '../interfaces';
import {
	CommonCartridgeResourceFactory,
	CommonCartridgeResourceProps,
} from '../resources/common-cartridge-resource-factory';
import { CommonCartridgeResourcesBuilder } from './common-cartridge-resources-builder';

class CommonCartridgeResourceNode {
	private readonly parent: CommonCartridgeOrganizationNode;

	constructor(
		private readonly props: CommonCartridgeResourceProps & { version: CommonCartridgeVersion },
		parent: CommonCartridgeOrganizationNode
	) {
		this.parent = parent;
	}

	public get folder(): string {
		return this.parent ? `${this.parent.folder}/${this.props.identifier}` : this.props.identifier;
	}

	public build(): CommonCartridgeResource {
		const resource = CommonCartridgeResourceFactory.createResource({ ...this.props, folder: this.parent.folder });

		return resource;
	}
}

type CommonCartridgeOrganizationNodeProps = Omit<
	CommonCartridgeOrganizationElementPropsV110 | CommonCartridgeOrganizationElementPropsV130,
	'items'
>;

export class CommonCartridgeOrganizationNode {
	private readonly parent: CommonCartridgeOrganizationNode | null = null;

	private readonly children: (CommonCartridgeOrganizationNode | CommonCartridgeResourceNode)[] = [];

	constructor(
		private readonly props: CommonCartridgeOrganizationNodeProps,
		parent: CommonCartridgeOrganizationNode | null
	) {
		this.parent = parent;

		if (parent) {
			parent.addChild(this);
		}
	}

	public get folder(): string {
		return this.parent ? `${this.parent.folder}/${this.props.identifier}` : this.props.identifier;
	}

	public addChild(organization: CommonCartridgeOrganizationNode | CommonCartridgeResourceNode): void {
		this.children.push(organization);
	}

	public build(): CommonCartridgeElement {
		const organization = CommonCartridgeElementFactory.createElement({
			...this.props,
			version: this.props.version,
			items: this.children.map((child) => child.build()),
		});

		return organization;
	}
}

type CommonCartridgeExportFactoryProps = {
	version: CommonCartridgeVersion;
	identifier: string;
};

export class CommonCartridgeExportFactory {
	private readonly resourcesBuilder: CommonCartridgeResourcesBuilder;

	private readonly organizationsRoot: CommonCartridgeOrganizationNode[] = [];

	private metadataElement: CommonCartridgeElement | null = null;

	constructor(private readonly props: CommonCartridgeExportFactoryProps) {
		this.resourcesBuilder = new CommonCartridgeResourcesBuilder({ version: props.version });
	}

	public addMetadata(props: CommonCartridgeElementProps): void {
		this.metadataElement = CommonCartridgeElementFactory.createElement({
			version: this.props.version,
			...props,
		});
	}

	public addOrganization(
		props: Omit<CommonCartridgeOrganizationNodeProps, 'version' | 'type'>,
		parent: CommonCartridgeOrganizationNode | null
	): CommonCartridgeOrganizationNode {
		const organization = new CommonCartridgeOrganizationNode(
			{ ...props, version: this.props.version, type: CommonCartridgeElementType.ORGANIZATION },
			parent
		);

		if (!parent) {
			this.organizationsRoot.push(organization);
		}

		return organization;
	}

	public addResource(resource: CommonCartridgeResourceProps, parent: CommonCartridgeOrganizationNode): void {
		parent.addChild(new CommonCartridgeResourceNode({ ...resource, version: this.props.version }, parent));

		this.resourcesBuilder.addResource(resource);
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

		this.resourcesBuilder
			.build()
			.filter((resource) => !resource.canInline)
			.forEach((resource) => archive.addFile(resource.getFilePath(), Buffer.from(resource.getFileContent())));

		return archive.toBuffer();
	}
}
