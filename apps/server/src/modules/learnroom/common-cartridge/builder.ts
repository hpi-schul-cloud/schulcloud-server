import AdmZip from 'adm-zip';
import { CommonCartridgeVersion } from './common-cartridge-enums';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { ICommonCartridgeFile } from './common-cartridge-file.interface';
import { CommonCartridgeManifestElement } from './common-cartridge-manifest-element';
import {
	CommonCartridgeResourceItemElement,
	ICommonCartridgeResourceProps,
} from './common-cartridge-resource-item-element';
import { toXmlString } from './utils';
import { CommonCartridgeOrganizationItemElement } from './common-cartridge-organization-item-element';

type ICommonCartridgeOrganizationProps = {
	identifier: string;
	title: string;
	version: CommonCartridgeVersion;
};

type ICommonCartridgeFileBuilderOptions = {
	identifier: string;
	title: string;
	version?: CommonCartridgeVersion;
};

interface ICommonCartridgeOrganizationBuilder extends ICommonCartridgeFileBuilder {
	addResource(props: ICommonCartridgeResourceProps): ICommonCartridgeOrganizationBuilder;
}

interface ICommonCartridgeFileBuilder {
	addOrganizationItem(props: ICommonCartridgeOrganizationProps): ICommonCartridgeOrganizationBuilder;
	build(): Promise<Buffer>;
}

class CommonCartridgeOrganizationBuilder implements ICommonCartridgeOrganizationBuilder {
	private readonly resourceList = new Array<ICommonCartridgeElement & ICommonCartridgeFile>();

	constructor(
		private readonly props: ICommonCartridgeOrganizationProps,
		private readonly fileBuilder: ICommonCartridgeFileBuilder,
		private readonly zipBuilder: AdmZip
	) {}

	get organization(): ICommonCartridgeElement {
		return new CommonCartridgeOrganizationItemElement(this.props);
	}

	get resources(): ICommonCartridgeElement[] {
		return this.resourceList;
	}

	addOrganizationItem(props: ICommonCartridgeOrganizationProps): ICommonCartridgeOrganizationBuilder {
		return this.fileBuilder.addOrganizationItem(props);
	}

	addResource(props: ICommonCartridgeResourceProps): ICommonCartridgeOrganizationBuilder {
		const newResource = new CommonCartridgeResourceItemElement(props);
		this.resourceList.push(newResource);
		if (!newResource.canInline(this.props.version)) {
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

	constructor(private readonly options: ICommonCartridgeFileBuilderOptions) {}

	addOrganizationItem(props: ICommonCartridgeOrganizationProps): ICommonCartridgeOrganizationBuilder {
		const organizationBuilder = new CommonCartridgeOrganizationBuilder(props, this, this.zipBuilder);
		this.organizations.push(organizationBuilder);
		return organizationBuilder;
	}

	async build(): Promise<Buffer> {
		const organizations = this.organizations.map((organization) => organization.organization);
		const resources = this.organizations.flatMap((organization) => organization.resources);
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
