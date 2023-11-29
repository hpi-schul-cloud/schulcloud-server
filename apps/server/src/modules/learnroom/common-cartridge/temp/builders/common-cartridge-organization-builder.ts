import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';

export type CommonCartridgeOrganizationBuilderOptions = {
	version: CommonCartridgeVersion;
	title: string;
	identifier: string;
};

export class CommonCartridgeOrganizationBuilder {
	private readonly items = new Array<CommonCartridgeResource>();

	private readonly children = new Array<CommonCartridgeOrganizationBuilder>();

	constructor(
		protected readonly options: CommonCartridgeOrganizationBuilderOptions,
		private readonly parent?: CommonCartridgeOrganizationBuilder
	) {}

	public get resources(): CommonCartridgeResource[] {
		return this.items;
	}

	addOrganization(options: CommonCartridgeOrganizationBuilderOptions): CommonCartridgeOrganizationBuilder {
		const child = new CommonCartridgeOrganizationBuilder(options, this);

		this.children.push(child);

		return child;
	}

	addOrganizationItem(item: CommonCartridgeResource): CommonCartridgeOrganizationBuilder {
		this.items.push(item);

		return this;
	}

	build(): CommonCartridgeElement {
		// const title = isDefined(this.title, 'Title');
		// const identifier = isDefined(this.identifier, 'Identifier');

		throw new Error('Not implemented');
	}
}
