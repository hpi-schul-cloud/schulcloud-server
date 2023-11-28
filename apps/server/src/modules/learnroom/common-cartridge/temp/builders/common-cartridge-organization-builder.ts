import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import { checkDefined } from '../utils';

export class CommonCartridgeOrganizationBuilder {
	private title?: string;

	private identifier?: string;

	private items: CommonCartridgeResource[] = [];

	private children: CommonCartridgeElement[] = [];

	constructor(private readonly version: CommonCartridgeVersion, private readonly parent?: CommonCartridgeElement) {}

	setIdentifier(identifier: string): CommonCartridgeOrganizationBuilder {
		this.identifier = identifier;

		return this;
	}

	setTitle(title: string): CommonCartridgeOrganizationBuilder {
		this.title = title;

		return this;
	}

	addOrganization(organization: CommonCartridgeElement): CommonCartridgeOrganizationBuilder {
		this.items.push(organization);

		return new CommonCartridgeOrganizationBuilder(this.version);
	}

	addOrganizationItem(item: CommonCartridgeResource): CommonCartridgeOrganizationBuilder {
		this.items.push(item);

		return this;
	}

	build(): CommonCartridgeResource {
		// const title = isDefined(this.title, 'Title');
		// const identifier = isDefined(this.identifier, 'Identifier');

		throw new Error('Not implemented');
	}
}
