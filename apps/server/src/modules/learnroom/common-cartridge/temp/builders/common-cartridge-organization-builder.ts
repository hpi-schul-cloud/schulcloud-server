import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';

type CommonCartridgeOrganizationProps = {
	version: CommonCartridgeVersion;
	title: string;
	identifier: string;
};

export class CommonCartridgeOrganizationBuilder {
	private items: CommonCartridgeResource[] = [];

	private children: CommonCartridgeElement[] = [];

	constructor(private readonly props: CommonCartridgeOrganizationProps) {}

	addOrganization(props: CommonCartridgeOrganizationProps): CommonCartridgeOrganizationBuilder {
		return new CommonCartridgeOrganizationBuilder(props);
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
