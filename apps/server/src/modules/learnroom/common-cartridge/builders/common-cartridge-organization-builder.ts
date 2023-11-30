import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeOrganizationElement } from '../elements/common-cartridge-organization-element';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import {
	CommonCartridgeResourceFactory,
	CommonCartridgeResourceProps,
} from '../resources/common-cartridge-resource-factory';
import { OmitVersionAndFolder } from '../utils';

export type CommonCartridgeOrganizationBuilderOptions = {
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	folder?: string;
};

export class CommonCartridgeOrganizationBuilder {
	private readonly items = new Array<CommonCartridgeElement>();

	private readonly children = new Array<CommonCartridgeOrganizationBuilder>();

	constructor(
		protected readonly options: CommonCartridgeOrganizationBuilderOptions,
		private readonly addResourceToFileBuilder: (resource: CommonCartridgeResource) => void
	) {}

	private get folder(): string {
		return this.options.folder ? `${this.options.folder}/${this.options.identifier}` : this.options.identifier;
	}

	addSubOrganization(
		options: OmitVersionAndFolder<CommonCartridgeOrganizationBuilderOptions>
	): CommonCartridgeOrganizationBuilder {
		const child = new CommonCartridgeOrganizationBuilder(
			{ ...options, version: this.options.version, folder: this.folder },
			this.addResourceToFileBuilder.bind(this)
		);

		this.children.push(child);

		return child;
	}

	addResource(props: CommonCartridgeResourceProps): CommonCartridgeOrganizationBuilder {
		const resource = CommonCartridgeResourceFactory.create({
			...props,
			version: this.options.version,
			folder: this.folder,
		});

		this.items.push(resource);
		this.addResourceToFileBuilder(resource);

		return this;
	}

	build(): CommonCartridgeElement {
		return new CommonCartridgeOrganizationElement({
			identifier: this.options.identifier,
			title: this.options.title,
			items: this.items,
		});
	}
}
