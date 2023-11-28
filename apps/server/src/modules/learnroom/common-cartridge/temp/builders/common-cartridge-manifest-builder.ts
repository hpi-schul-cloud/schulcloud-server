import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeManifestElement } from '../elements/common-cartridge-manifest-element';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { checkForNullOrUndefined } from '../utils';

export class CommonCartridgeManifestBuilder {
	private metadata?: CommonCartridgeElement;

	private organizations?: CommonCartridgeElement[];

	private resources?: CommonCartridgeResource[];

	constructor(private readonly version: CommonCartridgeVersion) {}

	setMetadata(metadata: CommonCartridgeElement): CommonCartridgeManifestBuilder {
		this.metadata = metadata;

		return this;
	}

	setOrganizations(organizations: CommonCartridgeElement[]): CommonCartridgeManifestBuilder {
		this.organizations = organizations;

		return this;
	}

	setResources(resources: CommonCartridgeResource[]): CommonCartridgeManifestBuilder {
		this.resources = resources;

		return this;
	}

	build(): CommonCartridgeResource {
		const metadata = checkForNullOrUndefined(this.metadata, 'Metadata');
		const organizations = checkForNullOrUndefined(this.organizations, 'Organizations');
		const resources = checkForNullOrUndefined(this.resources, 'Resources');

		return new CommonCartridgeManifestElement({
			version: this.version,
			metadata,
			organizations,
			resources,
		});
	}
}
