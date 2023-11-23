import AdmZip from 'adm-zip';
import { Builder } from 'xml2js';
import { CommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeVersion } from './common-cartridge-enums';
import { CommonCartridgeManifestElement } from './common-cartridge-manifest-element';
import {
	CommonCartridgeOrganizationItemElement,
	CommonCartridgeOrganizationItemElementProps,
	OrganizationItemCollection,
} from './common-cartridge-organization-item-element';
import {
	CommonCartridgeResourceItemElement,
	ICommonCartridgeResourceProps,
} from './common-cartridge-resource-item-element';

export type CommonCartridgeFileBuilderOptions = {
	identifier: string;
	title: string;
	copyrightOwners: string;
	creationYear: string;
	version: CommonCartridgeVersion;
};

export interface ICommonCartridgeOrganizationBuilder {
	addResourceToOrganization(props: ICommonCartridgeResourceProps): ICommonCartridgeOrganizationBuilder;
	addSubOrganization(props: CommonCartridgeOrganizationItemElementProps): ICommonCartridgeOrganizationBuilder;
}

export interface ICommonCartridgeFileBuilder {
	addOrganization(props: CommonCartridgeOrganizationItemElementProps): ICommonCartridgeOrganizationBuilder;

	addResourceToFile(props: ICommonCartridgeResourceProps): ICommonCartridgeFileBuilder;

	build(): Promise<Buffer>;
}

class CommonCartridgeOrganizationBuilder implements ICommonCartridgeOrganizationBuilder {
	constructor(
		private readonly props: CommonCartridgeOrganizationItemElementProps,
		private readonly xmlBuilder: Builder,
		private readonly zipBuilder: AdmZip
	) {}

	private resourceProperties: ICommonCartridgeResourceProps[] = [];

	private children: CommonCartridgeOrganizationBuilder[] = [];

	get organization(): CommonCartridgeElement {
		return new CommonCartridgeOrganizationItemElement(this.orgProps);
	}

	get orgProps(): OrganizationItemCollection {
		// TODO resources
		return {
			_tag: 'itemCollection',
			title: this.props.title,
			children: this.children.map((child) => child.orgProps),
		};
	}

	get resources(): CommonCartridgeElement[] {
		return this.children
			.flatMap((child) => child.resourceProperties)
			.concat(this.resourceProperties)
			.map((resourceProps) => new CommonCartridgeResourceItemElement(resourceProps, this.xmlBuilder));
	}

	addResourceToOrganization(props: ICommonCartridgeResourceProps): ICommonCartridgeOrganizationBuilder {
		const newResource = new CommonCartridgeResourceItemElement(props, this.xmlBuilder);
		this.resourceProperties.push(props);
		if (!newResource.canInline()) {
			this.zipBuilder.addFile(props.href, Buffer.from(newResource.content()));
		}
		return this;
	}

	addSubOrganization(props: CommonCartridgeOrganizationItemElementProps): ICommonCartridgeOrganizationBuilder {
		const subOrgBuilder = new CommonCartridgeOrganizationBuilder(props, this.xmlBuilder, this.zipBuilder);
		this.children.push(subOrgBuilder);
		return subOrgBuilder;
	}
}

export class CommonCartridgeFileBuilder implements ICommonCartridgeFileBuilder {
	private readonly xmlBuilder = new Builder();

	private readonly zipBuilder = new AdmZip();

	private readonly organizations = new Array<CommonCartridgeOrganizationBuilder>();

	private readonly resources = new Array<CommonCartridgeResourceItemElement>();

	constructor(private readonly options: CommonCartridgeFileBuilderOptions) {}

	addOrganization(props: CommonCartridgeOrganizationItemElementProps): ICommonCartridgeOrganizationBuilder {
		const organizationBuilder = new CommonCartridgeOrganizationBuilder(props, this.xmlBuilder, this.zipBuilder);
		this.organizations.push(organizationBuilder);
		return organizationBuilder;
	}

	addResourceToFile(props: ICommonCartridgeResourceProps): ICommonCartridgeFileBuilder {
		const resource = new CommonCartridgeResourceItemElement(props, this.xmlBuilder);
		if (!resource.canInline()) {
			this.zipBuilder.addFile(props.href, Buffer.from(resource.content()));
		}
		this.resources.push(resource);
		return this;
	}

	async build(): Promise<Buffer> {
		const organizations = this.organizations.map((organization) => organization.organization);
		const resources = this.organizations.flatMap((organization) => organization.resources).concat(this.resources);
		const manifest = this.xmlBuilder.buildObject(
			new CommonCartridgeManifestElement(
				{
					identifier: this.options.identifier,
				},
				{
					title: this.options.title,
					copyrightOwners: this.options.copyrightOwners,
					creationYear: this.options.creationYear,
					version: this.options.version,
				},
				organizations,
				resources
			).transform()
		);
		this.zipBuilder.addFile('imsmanifest.xml', Buffer.from(manifest));
		return this.zipBuilder.toBufferPromise();
	}
}
