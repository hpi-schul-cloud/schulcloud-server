import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { CommonCartridgeManifestResource } from '../resources/common-cartridge-manifest-resource';

type CommonCartridgeManifestBuilderProps = {
	version: CommonCartridgeVersion;
	identifier: string;
	metadata: CommonCartridgeElement;
	organizations: CommonCartridgeElement[];
	resources: CommonCartridgeResource[];
};

export class CommonCartridgeManifestBuilder {
	constructor(private readonly props: CommonCartridgeManifestBuilderProps) {}

	build(): CommonCartridgeResource {
		const manifestResource = new CommonCartridgeManifestResource({
			version: this.props.version,
			identifier: this.props.identifier,
			metadata: this.props.metadata,
			organizations: this.props.organizations,
			resources: this.props.resources,
		});

		return manifestResource;
	}
}
