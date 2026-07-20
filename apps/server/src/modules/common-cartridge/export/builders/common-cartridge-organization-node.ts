import { CommonCartridgeElementType } from '../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../elements/common-cartridge-element-factory';
import { type CommonCartridgeElement } from '../interfaces';
import { type CommonCartridgeResourceProps } from '../resources/common-cartridge-resource-factory';
import type {
	CommonCartridgeOrganizationNodeProps,
	CommonCartridgeOrganizationProps,
} from './common-cartridge-organization.types';
import { type CommonCartridgeResourceCollectionBuilder } from './common-cartridge-resource-collection-builder';
import { CommonCartridgeResourceNode } from './common-cartridge-resource-node';

export class CommonCartridgeOrganizationNode {
	private readonly parent: CommonCartridgeOrganizationNode | null = null;

	private readonly children: (CommonCartridgeOrganizationNode | CommonCartridgeResourceNode)[] = [];

	constructor(
		private readonly props: CommonCartridgeOrganizationNodeProps,
		private readonly resourcesBuilder: CommonCartridgeResourceCollectionBuilder,
		parent: CommonCartridgeOrganizationNode | null
	) {
		this.parent = parent;
	}

	get folder(): string {
		return this.parent ? `${this.parent.folder}/${this.props.identifier}` : this.props.identifier;
	}

	public createChild(childProps: CommonCartridgeOrganizationProps): CommonCartridgeOrganizationNode {
		const organization = new CommonCartridgeOrganizationNode(
			{
				...childProps,
				version: this.props.version,
				type: CommonCartridgeElementType.ORGANIZATION,
			},
			this.resourcesBuilder,
			this
		);

		this.children.push(organization);

		return organization;
	}

	public addResource(resourceProps: CommonCartridgeResourceProps): void {
		const resource = new CommonCartridgeResourceNode(
			{
				...resourceProps,
				version: this.props.version,
			},
			this.folder
		);

		this.children.push(resource);
		this.resourcesBuilder.addResource(resource);
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
