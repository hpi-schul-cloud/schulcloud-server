import { CommonCartridgeElementType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeElementFactory } from '../elements/common-cartridge-element-factory';
import { CommonCartridgeElement } from '../interfaces/common-cartridge-element.interface';
import { CommonCartridgeResource } from '../interfaces/common-cartridge-resource.interface';
import {
	CommonCartridgeResourceFactory,
	CommonCartridgeResourceProps,
} from '../resources/common-cartridge-resource-factory';
import { OmitVersionAndFolder } from '../utils';

export type CommonCartridgeOrganizationBuilderOptions =
	OmitVersionAndFolder<CommonCartridgeOrganizationBuilderOptionsInternal>;

type CommonCartridgeOrganizationBuilderOptionsInternal = {
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	folder?: string;
};

export class CommonCartridgeOrganizationBuilder {
	private readonly resources: CommonCartridgeResource[] = [];

	private readonly subOrganizations: CommonCartridgeOrganizationBuilder[] = [];

	constructor(
		protected readonly options: CommonCartridgeOrganizationBuilderOptionsInternal,
		private readonly addResourceToFileBuilder: (resource: CommonCartridgeResource) => void
	) {}

	private get folder(): string {
		return this.options.folder ? `${this.options.folder}/${this.options.identifier}` : this.options.identifier;
	}

	public addSubOrganization(
		options: OmitVersionAndFolder<CommonCartridgeOrganizationBuilderOptions>
	): CommonCartridgeOrganizationBuilder {
		const subOrganization = new CommonCartridgeOrganizationBuilder(
			{ ...options, version: this.options.version, folder: this.folder },
			(resource: CommonCartridgeResource) => this.addResourceToFileBuilder(resource)
		);

		this.subOrganizations.push(subOrganization);

		return subOrganization;
	}

	public addResource(props: CommonCartridgeResourceProps): CommonCartridgeOrganizationBuilder {
		const resource = CommonCartridgeResourceFactory.createResource({
			version: this.options.version,
			folder: this.folder,
			...props,
		});

		this.resources.push(resource);
		this.addResourceToFileBuilder(resource);

		return this;
	}

	public build(): CommonCartridgeElement {
		const organizationElement = CommonCartridgeElementFactory.createElement({
			type: CommonCartridgeElementType.ORGANIZATION,
			version: this.options.version,
			identifier: this.options.identifier,
			title: this.options.title,
			items: this.buildItems(),
		});

		return organizationElement;
	}

	private buildItems(): (CommonCartridgeElement | CommonCartridgeResource)[] {
		if (this.resources.length === 1 && this.subOrganizations.length === 0) {
			return [...this.resources];
		}

		const items = [...this.resources, ...this.subOrganizations.map((subOrganization) => subOrganization.build())];

		return items;
	}
}
