import AdmZip from 'adm-zip';
import { Builder } from 'xml2js';
import { CommonCartridgeVersion } from './common-cartridge-enums';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeManifestElement } from './common-cartridge-manifest-element';
import {
	CommonCartridgeResourceItemElement,
	ICommonCartridgeResourceProps,
} from './common-cartridge-resource-item-element';
import {
	CommonCartridgeOrganizationItemElement,
	ICommonCartridgeOrganizationProps,
} from './common-cartridge-organization-item-element';

export type ICommonCartridgeFileBuilderOptions = {
	identifier: string;
	title: string;
	copyrightOwners: string;
	currentYear: string;
	version?: CommonCartridgeVersion;
};

export interface ICommonCartridgeOrganizationBuilder {
	addResourceToOrganization(props: ICommonCartridgeResourceProps): ICommonCartridgeOrganizationBuilder;
}

export interface ICommonCartridgeFileBuilder {
	addOrganization(props: ICommonCartridgeOrganizationProps): ICommonCartridgeOrganizationBuilder;
	addResourceToFile(props: ICommonCartridgeResourceProps): ICommonCartridgeFileBuilder;
	build(): Promise<Buffer>;
}

class CommonCartridgeOrganizationBuilder implements ICommonCartridgeOrganizationBuilder {
	constructor(
		private readonly props: ICommonCartridgeOrganizationProps,
		private readonly fileBuilder: ICommonCartridgeFileBuilder,
		private readonly xmlBuilder: Builder,
		private readonly zipBuilder: AdmZip
	) {}

	get organization(): ICommonCartridgeElement {
		return new CommonCartridgeOrganizationItemElement(this.props);
	}

	get resources(): ICommonCartridgeElement[] {
		return this.props.resources.map(
			(resourceProps) => new CommonCartridgeResourceItemElement(resourceProps, this.xmlBuilder)
		);
	}

	addResourceToOrganization(props: ICommonCartridgeResourceProps): ICommonCartridgeOrganizationBuilder {
		const newResource = new CommonCartridgeResourceItemElement(props, this.xmlBuilder);
		this.props.resources.push(props);
		if (!newResource.canInline()) {
			this.zipBuilder.addFile(props.href, Buffer.from(newResource.content()));
		}
		return this;
	}
}

export class CommonCartridgeFileBuilder implements ICommonCartridgeFileBuilder {
	private readonly xmlBuilder = new Builder();

	private readonly zipBuilder = new AdmZip();

	private readonly organizations = new Array<CommonCartridgeOrganizationBuilder>();

	private readonly resources = new Array<CommonCartridgeResourceItemElement>();

	constructor(private readonly options: ICommonCartridgeFileBuilderOptions) {}

	addOrganization(props: ICommonCartridgeOrganizationProps): ICommonCartridgeOrganizationBuilder {
		const organizationBuilder = new CommonCartridgeOrganizationBuilder(props, this, this.xmlBuilder, this.zipBuilder);
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
					currentYear: this.options.currentYear,
					version: this.options.version || CommonCartridgeVersion.V_1_1_0,
				},
				organizations,
				resources
			).transform()
		);
		this.zipBuilder.addFile('imsmanifest.xml', Buffer.from(manifest));
		return this.zipBuilder.toBufferPromise();
	}
}
