import { CommonCartridgeElementType } from '../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../elements/common-cartridge-element-factory';
import { CommonCartridgeOrganizationElementPropsV110 } from '../elements/v1.1.0';
import { CommonCartridgeOrganizationElementPropsV130 } from '../elements/v1.3.0';
import { CommonCartridgeElement } from '../interfaces';
import { CommonCartridgeResourceProps } from '../resources/common-cartridge-resource-factory';
import type { CommonCartridgeOrganizationProps } from './common-cartridge-export.factory';
import { CommonCartridgeResourceNode } from './common-cartridge-resource-node';
import { CommonCartridgeResourcesBuilder } from './common-cartridge-resources-builder';

export type CommonCartridgeOrganizationNodeProps = Omit<
	CommonCartridgeOrganizationElementPropsV110 | CommonCartridgeOrganizationElementPropsV130,
	'items'
>;

export class CommonCartridgeOrganizationNode {
	private readonly parent: CommonCartridgeOrganizationNode | null = null;

	private readonly children: (CommonCartridgeOrganizationNode | CommonCartridgeResourceNode)[] = [];

	constructor(
		private readonly props: CommonCartridgeOrganizationNodeProps,
		private readonly resourcesBuilder: CommonCartridgeResourcesBuilder,
		parent: CommonCartridgeOrganizationNode | null
	) {
		this.parent = parent;
	}

	public get folder(): string {
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
			this
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
