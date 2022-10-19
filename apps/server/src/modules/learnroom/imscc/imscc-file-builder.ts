import AdmZip from 'adm-zip';
import { Builder } from 'xml2js';
import { ImsccMetadataElement } from './imscc-metadata-element';
import {
	ImsccOrganizationItemElement,
	IImsccOrganizationProps,
	
} from './imscc-organization-item-element';
import { IImsccResourceProps, ImsccResourceElement } from './imscc-resource-element';
import {ImsccResourceWrapperElement} from "@src/modules/learnroom/imscc/imscc-resource-wrapper-element";
import {ImsccOrganizationWrapperElement} from "@src/modules/learnroom/imscc/imscc-organization-wrapper-element";

export type IImsccFileBuilderOptions = {
	title: string;
};

export class ImsccFileBuilder {
	private readonly zipBuilder = new AdmZip();

	private readonly xmlBuilder = new Builder({
		rootName: 'manifest',
	});

	private metadata: ImsccMetadataElement;

	private organizations = [] as ImsccOrganizationItemElement[];

	private resources = [] as ImsccResourceElement[];

	constructor(options: IImsccFileBuilderOptions) {
		this.metadata = new ImsccMetadataElement({
			title: options.title,
		});
	}

	get manifest(): string {
		return this.xmlBuilder.buildObject({
			metadata: this.metadata.transform(),
			organizations: new ImsccOrganizationWrapperElement(this.organizations).transform(),
			resources: new ImsccResourceWrapperElement(this.resources).transform(),
		});
	}

	async build(): Promise<Buffer> {
		this.zipBuilder.addFile('imsmanifest.xml', Buffer.from(this.manifest));
		return this.zipBuilder.toBufferPromise();
	}

	addOrganizations(props: IImsccOrganizationProps | IImsccOrganizationProps[]): ImsccFileBuilder {
		if (Array.isArray(props)) {
			props.map((prop) => this.organizations.push(new ImsccOrganizationItemElement(prop)));
		} else {
			this.organizations.push(new ImsccOrganizationItemElement(props));
		}
		return this;
	}

	addResources(props: IImsccResourceProps | IImsccResourceProps[]): ImsccFileBuilder {
		if (Array.isArray(props)) {
			props.map((prop) => this.resources.push(new ImsccResourceElement(prop)));
		} else {
			this.resources.push(new ImsccResourceElement(props));
		}
		return this;
	}
}
