import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { CommonCartridgeManifestResource } from '../resources/common-cartridge-manifest-resource';
import { checkDefined } from '../utils';

export class CommonCartridgeManifestBuilder {
	private identifier?: string;

	private metadata?: CommonCartridgeElement;

	private organizations?: CommonCartridgeElement[];

	private resources?: CommonCartridgeResource[];

	constructor(private readonly version: CommonCartridgeVersion) {}

	setIdentifier(identifier: string): CommonCartridgeManifestBuilder {
		this.identifier = identifier;

		return this;
	}

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
		const identifier = checkDefined(this.identifier, 'Identifier');
		const metadata = checkDefined(this.metadata, 'Metadata');
		const organizations = checkDefined(this.organizations, 'Organizations');
		const resources = checkDefined(this.resources, 'Resources');

		return new CommonCartridgeManifestResource({
			version: this.version,
			identifier,
			metadata,
			organizations,
			resources,
		});
	}
}
