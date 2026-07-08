import { type CommonCartridgeVersion } from '../common-cartridge.enums';
import { type CommonCartridgeResource } from '../interfaces';
import {
	CommonCartridgeResourceFactory,
	type CommonCartridgeResourceProps,
} from '../resources/common-cartridge-resource-factory';
import type { CommonCartridgeOrganizationNode } from './common-cartridge-organization-node';

export type CommonCartridgeResourceNodeProps = CommonCartridgeResourceProps & { version: CommonCartridgeVersion };

export class CommonCartridgeResourceNode {
	private readonly parent: CommonCartridgeOrganizationNode;

	constructor(
		private readonly props: CommonCartridgeResourceNodeProps,
		parent: CommonCartridgeOrganizationNode
	) {
		this.parent = parent;
	}

	public build(): CommonCartridgeResource {
		const resource = CommonCartridgeResourceFactory.createResource({ ...this.props, folder: this.parent.folder });

		return resource;
	}
}
