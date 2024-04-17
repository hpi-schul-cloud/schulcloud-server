import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeResource } from '../interfaces';
import {
	CommonCartridgeResourceFactory,
	CommonCartridgeResourceProps,
	CommonCartridgeResourcePropsInternal,
} from '../resources/common-cartridge-resource-factory';

type CommonCartridgeResourcesBuilderProps = {
	version: CommonCartridgeVersion;
};

export class CommonCartridgeResourcesBuilder {
	private readonly resources: CommonCartridgeResourceProps[] = [];

	constructor(private readonly props: CommonCartridgeResourcesBuilderProps) {}

	addResource(resource: CommonCartridgeResourceProps): void {
		this.resources.push(resource);
	}

	build(): CommonCartridgeResource[] {
		return this.resources.map((resource) =>
			CommonCartridgeResourceFactory.createResource({
				// TODO: Fix this cast
				version: this.props.version,
				...resource,
			} as CommonCartridgeResourcePropsInternal)
		);
	}
}
