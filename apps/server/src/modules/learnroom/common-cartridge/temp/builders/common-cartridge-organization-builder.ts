import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';

export class CommonCartridgeOrganizationBuilder {
	private title = '';

	private identifier = '';

	private items: CommonCartridgeElement[] = [];

	setIdentifier(identifier: string): CommonCartridgeOrganizationBuilder {
		this.identifier = identifier;

		return this;
	}

	setTitle(title: string): CommonCartridgeOrganizationBuilder {
		this.title = title;

		return this;
	}

	addItem(item: CommonCartridgeElement): CommonCartridgeOrganizationBuilder {
		this.items.push(item);

		return this;
	}

	build(): CommonCartridgeResource {
		throw new Error('Method not implemented.');
	}
}
