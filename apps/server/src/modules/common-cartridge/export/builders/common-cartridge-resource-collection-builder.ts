import { CommonCartridgeResource } from '../interfaces';
import { CommonCartridgeResourceProps } from '../resources/common-cartridge-resource-factory';

export class CommonCartridgeResourceCollectionBuilder {
	private readonly resources = new Array<CommonCartridgeResource>();

	constructor(private readonly props: CommonCartridgeResourceProps) {}

	public addResource(resource: CommonCartridgeResource): void {
		this.resources.push(resource);
	}

	public getResources(): CommonCartridgeResource[] {
		return this.resources;
	}
}
