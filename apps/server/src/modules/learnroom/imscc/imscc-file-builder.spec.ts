import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import { IImsccFileBuilderOptions, ImsccFileBuilder } from './imscc-file-builder';
import { IImsccOrganizationProps } from './imscc-organization-element';
import { IImsccResourceProps } from './imscc-resource-element';

describe('ImsccFileBuilder', () => {
	const builderOptions: IImsccFileBuilderOptions = {
		title: 'Placeholder Title',
	};
	const organizationProps: IImsccOrganizationProps = {
		identifier: 'organization-identifier',
		title: 'organization-title',
	};
	const resourceProps: IImsccResourceProps = {
		identifier: 'resource-identifier',
		type: 'webcontent',
		href: 'placeholder.html',
		file: 'placeholder.html',
	};
	let builder: ImsccFileBuilder;

	beforeEach(() => {
		builder = new ImsccFileBuilder(builderOptions);
	});

	describe('manifest', () => {
		it('should return valid xml string', async () => {
			await expect(parseStringPromise(builder.manifest)).resolves.not.toThrow();
		});
	});

	describe('build', () => {
		it('should return a buffer', async () => {
			builder.addOrganizations(organizationProps).addResources(resourceProps);

			await expect(builder.build()).resolves.toBeInstanceOf(Buffer);
		});

		it('should place manifest in root directory', async () => {
			const buffer = await builder.addOrganizations(organizationProps).addResources(resourceProps).build();
			const archive = new AdmZip(buffer);
			const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

			expect(manifest).toContain(builderOptions.title);
			expect(manifest).toContain(organizationProps.title);
			expect(manifest).toContain(resourceProps.identifier);
		});
	});

	describe('addOrganizations', () => {
		it('should add an organization element to the manifest', () => {
			builder.addOrganizations(organizationProps).addOrganizations([organizationProps]);

			expect(builder.manifest).toContain(builderOptions.title);
			expect(builder.manifest).toContain(organizationProps.title);
		});
	});

	describe('addResources', () => {
		it('should add a resource element to the manifest', () => {
			builder.addResources(resourceProps).addResources([resourceProps]);

			expect(builder.manifest).toContain(builderOptions.title);
			expect(builder.manifest).toContain(resourceProps.identifier);
		});
	});
});
