import AdmZip from 'adm-zip';
import { CommonCartridgeVersion } from './common-cartridge-enums';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeManifestElement } from './common-cartridge-manifest-element';
import {
	CommonCartridgeResourceItemElement,
	ICommonCartridgeResourceProps,
} from './common-cartridge-resource-item-element';
import { toXmlString } from './utils';
import {
	CommonCartridgeOrganizationItemElement,
	ICommonCartridgeOrganizationProps,
} from './common-cartridge-organization-item-element';

export type ICommonCartridgeFileBuilderOptions = {
	identifier: string;
	title: string;
	version?: CommonCartridgeVersion;
};

export interface ICommonCartridgeOrganizationBuilder extends ICommonCartridgeFileBuilder {
	addResourceToOrganization(props: ICommonCartridgeResourceProps): ICommonCartridgeOrganizationBuilder;
}

export interface ICommonCartridgeFileBuilder {
	addOrganization(props: ICommonCartridgeOrganizationProps): ICommonCartridgeOrganizationBuilder;
	build(): Promise<Buffer>;
}

class CommonCartridgeOrganizationBuilder implements ICommonCartridgeOrganizationBuilder {
	constructor(
		private readonly props: ICommonCartridgeOrganizationProps,
		private readonly fileBuilder: ICommonCartridgeFileBuilder,
		private readonly zipBuilder: AdmZip
	) {}

	get organization(): ICommonCartridgeElement {
		return new CommonCartridgeOrganizationItemElement(this.props);
	}

	get resources(): ICommonCartridgeElement[] {
		return this.props.resources.map((resourceProps) => new CommonCartridgeResourceItemElement(resourceProps));
	}

	addOrganization(props: ICommonCartridgeOrganizationProps): ICommonCartridgeOrganizationBuilder {
		return this.fileBuilder.addOrganization(props);
	}

	addResourceToOrganization(props: ICommonCartridgeResourceProps): ICommonCartridgeOrganizationBuilder {
		const newResource = new CommonCartridgeResourceItemElement(props);
		this.props.resources.push(props);
		if (!newResource.canInline()) {
			this.zipBuilder.addFile(props.href, Buffer.from(newResource.content()));
		}
		return this;
	}

	build(): Promise<Buffer> {
		return this.fileBuilder.build();
	}
}

export class CommonCartridgeFileBuilder implements ICommonCartridgeFileBuilder {
	private readonly zipBuilder = new AdmZip();

	private readonly organizations = new Array<CommonCartridgeOrganizationBuilder>();

	private readonly resources = new Array<CommonCartridgeResourceItemElement>();

	constructor(private readonly options: ICommonCartridgeFileBuilderOptions) {}

	addOrganization(props: ICommonCartridgeOrganizationProps): ICommonCartridgeOrganizationBuilder {
		const organizationBuilder = new CommonCartridgeOrganizationBuilder(props, this, this.zipBuilder);
		this.organizations.push(organizationBuilder);
		return organizationBuilder;
	}

	addResourceToFile(props: ICommonCartridgeResourceProps): ICommonCartridgeFileBuilder {
		const resource = new CommonCartridgeResourceItemElement(props);
		this.resources.push(resource);
		return this;
	}

	async build(): Promise<Buffer> {
		const organizations = this.organizations.map((organization) => organization.organization);
		const resources = this.organizations.flatMap((organization) => organization.resources).concat(this.resources);
		const manifest = toXmlString(
			new CommonCartridgeManifestElement(
				{
					identifier: this.options.identifier,
				},
				{
					title: this.options.title,
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
