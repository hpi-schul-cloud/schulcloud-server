import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';

export class CommonCartridgeOrganizationBuilder {
	private title = '';

	private identifier = '';

	private items: CommonCartridgeElement[] = [];

	public setIdentifier(identifier: string): CommonCartridgeOrganizationBuilder {
		this.identifier = identifier;

		return this;
	}

	public setTitle(title: string): CommonCartridgeOrganizationBuilder {
		this.title = title;

		return this;
	}

	public addItem(item: CommonCartridgeElement): CommonCartridgeOrganizationBuilder {
		this.items.push(item);

		return this;
	}

	public build(): CommonCartridgeElement & CommonCartridgeResource {
		throw new Error('Method not implemented.');
	}
}
