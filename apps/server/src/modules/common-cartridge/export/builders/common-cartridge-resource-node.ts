import { type CommonCartridgeVersion } from '../common-cartridge.enums';
import { type CommonCartridgeResource } from '../interfaces';
import {
	CommonCartridgeResourceFactory,
	type CommonCartridgeResourceProps,
} from '../resources/common-cartridge-resource-factory';

export type CommonCartridgeResourceNodeProps = CommonCartridgeResourceProps & { version: CommonCartridgeVersion };

export class CommonCartridgeResourceNode {
	private readonly parentFolder: string;

	constructor(
		private readonly props: CommonCartridgeResourceNodeProps,
		parentFolder: string
	) {
		this.parentFolder = parentFolder;
	}

	public build(): CommonCartridgeResource {
		const resource = CommonCartridgeResourceFactory.createResource({ ...this.props, folder: this.parentFolder });

		return resource;
	}
}
