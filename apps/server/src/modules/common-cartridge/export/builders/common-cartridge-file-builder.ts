import AdmZip from 'adm-zip';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../common-cartridge.enums';
import {
	CommonCartridgeElementFactory,
	CommonCartridgeElementProps,
} from '../elements/common-cartridge-element-factory';
import { CommonCartridgeElement, CommonCartridgeResource } from '../interfaces';
import {
	CommonCartridgeResourceFactory,
	CommonCartridgeResourcePropsInternal,
} from '../resources/common-cartridge-resource-factory';
import { CommonCartridgeOrganizationBuilder } from './common-cartridge-organization-builder';

export type CommonCartridgeFileBuilderProps = {
	version: CommonCartridgeVersion;
	identifier: string;
};

export class CommonCartridgeFileBuilder {
	private readonly archive: AdmZip = new AdmZip();

	private readonly organizationBuilders = new Array<CommonCartridgeOrganizationBuilder>();

	private readonly resources = new Array<CommonCartridgeResource>();

	private metadata?: CommonCartridgeElement;

	constructor(private readonly props: CommonCartridgeFileBuilderProps) {}

	public addMetadata(props: CommonCartridgeElementProps): CommonCartridgeFileBuilder {
		this.metadata = CommonCartridgeElementFactory.createElement({
			version: this.props.version,
			...props,
		});

		return this;
	}

	public addOrganization(organizationBuilder: CommonCartridgeOrganizationBuilder): void {
		const builder = new CommonCartridgeOrganizationBuilder(
			{ ...props, version: this.props.version },
			(resource: CommonCartridgeResource) => this.resources.push(resource)
		);

		this.organizationBuilders.push(organizationBuilder);
	}

	/* public addOrganization(
		props: OmitVersion<CommonCartridgeOrganizationBuilderOptions>
	): CommonCartridgeOrganizationBuilder {
		const builder = new CommonCartridgeOrganizationBuilder(
			{ ...props, version: this.props.version },
			(resource: CommonCartridgeResource) => this.resources.push(resource)
		);

		this.organizationBuilders.push(builder);

		return builder;
	}
*/

	public async build(): Promise<Buffer> {
		if (!this.metadata) {
			throw new Error('Metadata is not defined');
		}

		const organizations = this.organizationBuilders.map((builder) => builder.build());
		const manifest = CommonCartridgeResourceFactory.createResource({
			type: CommonCartridgeResourceType.MANIFEST,
			version: this.props.version,
			identifier: this.props.identifier,
			metadata: this.metadata,
			organizations,
			resources: this.resources,
		});

		for (const resources of this.resources) {
			if (!resources.canInline()) {
				this.archive.addFile(resources.getFilePath(), Buffer.from(resources.getFileContent()));
			}
		}

		this.archive.addFile(manifest.getFilePath(), Buffer.from(manifest.getFileContent()));

		const buffer = await this.archive.toBufferPromise();

		return buffer;
	}
}

type CCFileBuilderOptions = {
	version: CommonCartridgeVersion;
	identifier: string;
};

interface CCMetadataBuilder {
	setTitle(title: string): CCMetadataBuilder;

	setCreationDate(date: Date): CCMetadataBuilder;

	setCopyrightOwners(copyrightOwners: string[]): CCMetadataBuilder; // addCopyrightOwner Methode hinzufügen
}

class CCMetadataBuilderImpl implements CCMetadataBuilder {
	private title = '';

	private creationDate: Date = new Date();

	private copyrightOwners: string[] = [];

	constructor(private readonly props: CCFileBuilderOptions) {}

	public setTitle(title: string): CCMetadataBuilder {
		this.title = title;

		return this;
	}

	public setCreationDate(date: Date): CCMetadataBuilder {
		this.creationDate = date;

		return this;
	}

	public setCopyrightOwners(copyrightOwners: string[]): CCMetadataBuilder {
		this.copyrightOwners = copyrightOwners;

		return this;
	}

	public build(): CommonCartridgeElement {
		const metadataElement = CommonCartridgeElementFactory.createElement({
			type: CommonCartridgeElementType.METADATA,
			version: this.props.version,
			title: this.title,
			creationDate: this.creationDate,
			copyrightOwners: this.copyrightOwners,
		});

		return metadataElement;
	}
}

type CCOrganizationBuilderOptions = {
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
} & CCFileBuilderOptions;

class CCOrganizationBuilderImpl {
	private identifier = '';

	private title = '';

	private items = new Array<CCOrganizationBuilderImpl>();

	constructor(
		private readonly resourceBuilder: CCResourceBuilder,
		private readonly props: CCOrganizationBuilderOptions
	) {}

	public addOrganization(props: CCOrganizationBuilderOptions): CCOrganizationBuilderImpl {
		const subOrganizationBuilder = new CCOrganizationBuilderImpl(this.resourceBuilder, props);

		this.items.push(subOrganizationBuilder);

		return this;
	}

	public build(): CommonCartridgeElement {
		throw new Error('Method not implemented.');
	}
}

class CCResourceBuilder {
	private readonly resources = new Array<CommonCartridgeResourcePropsInternal>();

	constructor(private readonly props: CCFileBuilderOptions) {}

	public addResource(resource: CommonCartridgeResourcePropsInternal): CCResourceBuilder {
		this.resources.push(resource);

		return this;
	}

	public build(): CommonCartridgeResource[] {
		const result = this.resources.map((resource) =>
			CommonCartridgeResourceFactory.createResource({
				...resource,
				version: this.props.version,
			})
		);

		return result;
	}
}

export class CCFileBuilder {
	private readonly metadataBuilder: CCMetadataBuilderImpl;

	private readonly organizationBuilder: CCOrganizationBuilderImpl;

	private readonly resourceBuilder: CCResourceBuilder;

	constructor(private readonly props: CCFileBuilderOptions) {
		this.resourceBuilder = new CCResourceBuilder(props);
		this.metadataBuilder = new CCMetadataBuilderImpl(props);
		this.organizationBuilder = new CCOrganizationBuilderImpl(this.resourceBuilder, props);
	}

	public get metadata(): CCMetadataBuilder {
		return this.metadataBuilder;
	}

	public get organizations(): CCOrganizationBuilder {
		return this.organizationBuilder;
	}

	public build(): Buffer {
		const archive = new AdmZip();
		const organization = this.organizationBuilder.build();
		const resources = this.resourceBuilder.build();
		const manifest = CommonCartridgeResourceFactory.createResource({
			type: CommonCartridgeResourceType.MANIFEST,
			version: this.props.version,
			identifier: this.props.identifier,
			metadata: this.metadataBuilder.build(),
			organization,
			resources,
		});

		archive.addFile(manifest.getFilePath(), Buffer.from(manifest.getFileContent()));

		for (const resource of resources.filter((res) => !res.canInline())) {
			archive.addFile(resource.getFilePath(), Buffer.from(resource.getFileContent()));
		}

		return archive.toBuffer();
	}
}

const fileBuilder = new CCFileBuilder({
	version: CommonCartridgeVersion.V_1_1_0,
	identifier: 'test',
});

fileBuilder.metadata.setTitle('Test').setCreationDate(new Date()).setCopyrightOwners(['Simone', 'Patrick']);

const orga1 = fileBuilder.organizations.setIdentifier('org1').setTitle('Organization 1').addOrganization();

const sub1 = orga1.addOrganization().setIdentifier('sub1').setTitle('Suborganization 1');
const sub2 = orga1.addOrganization().setIdentifier('sub2').setTitle('Suborganization 2');
const subSub1 = sub1.addOrganization().setIdentifier('subsub1').setTitle('Subsuborganization 1');

console.log(fileBuilder.build());
