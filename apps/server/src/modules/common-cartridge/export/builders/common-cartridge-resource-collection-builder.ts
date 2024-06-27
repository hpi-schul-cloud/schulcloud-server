import { CommonCartridgeResource } from '../interfaces';
import { CommonCartridgeResourceNode } from './common-cartridge-resource-node';

export class CommonCartridgeResourceCollectionBuilder {
	private readonly resourceNodes: CommonCartridgeResourceNode[] = [];

	public addResource(resourceNode: CommonCartridgeResourceNode): void {
		this.resourceNodes.push(resourceNode);
	}

	public build(): CommonCartridgeResource[] {
		const resources = this.resourceNodes.map((resource) => resource.build());

		return resources;
	}
}
