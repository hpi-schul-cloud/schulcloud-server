import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import { ICommonCartridgeAssignmentProps } from '@src/modules/learnroom/common-cartridge/common-cartridge-assignment-element';
import { ICommonCartridgeFileBuilderOptions, CommonCartridgeFileBuilder } from './common-cartridge-file-builder';
import { ICommonCartridgeOrganizationProps } from './common-cartridge-organization-item-element';
import { ICommonCartridgeResourceProps } from './common-cartridge-resource-item-element';

describe('CommonCartridgeFileBuilder', () => {
	const builderOptions: ICommonCartridgeFileBuilderOptions = {
		identifier: 'Placeholder Identifier',
		title: 'Placeholder Title',
	};
	const organizationProps: ICommonCartridgeOrganizationProps = {
		identifier: 'organization-identifier',
		title: 'organization-title',
	};
	const resourceProps: ICommonCartridgeResourceProps = {
		identifier: 'resource-identifier',
		type: 'webcontent',
		href: 'placeholder.html',
	};
	const assignmentProps: ICommonCartridgeAssignmentProps = {
		identifier: 'assignment-identifier',
		title: 'assignment-title',
		description: 'assignment-description',
	};
	let builder: CommonCartridgeFileBuilder;

	beforeEach(() => {
		builder = new CommonCartridgeFileBuilder(builderOptions);
	});

	describe('manifest', () => {
		it('should return valid xml string', async () => {
			await expect(parseStringPromise(builder.manifest)).resolves.not.toThrow();
		});
	});

	describe('build', () => {
		it('should return a buffer', async () => {
			builder.addOrganizationItems([organizationProps]).addResourceItems([resourceProps]);

			await expect(builder.build()).resolves.toBeInstanceOf(Buffer);
		});

		it('should place manifest in root directory', async () => {
			const buffer = await builder.addOrganizationItems([organizationProps]).addResourceItems([resourceProps]).build();
			const archive = new AdmZip(buffer);
			const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

			expect(manifest).toContain(builderOptions.title);
			expect(manifest).toContain(organizationProps.title);
			expect(manifest).toContain(resourceProps.identifier);
		});
	});

	describe('addOrganizations', () => {
		it('should add an organization element to the manifest', () => {
			builder.addOrganizationItems([organizationProps]).addOrganizationItems([organizationProps]);

			expect(builder.manifest).toContain(builderOptions.title);
			expect(builder.manifest).toContain(organizationProps.title);
		});
	});

	describe('addResources', () => {
		it('should add a resource element to the manifest', () => {
			builder.addResourceItems([resourceProps]).addResourceItems([resourceProps]);

			expect(builder.manifest).toContain(builderOptions.title);
			expect(builder.manifest).toContain(resourceProps.identifier);
		});
	});

	describe('addAssignment', () => {
		let archive: AdmZip;

		beforeAll(async () => {
			const buffer = await builder
				.addOrganizationItems([organizationProps])
				.addAssignments([assignmentProps])
				.addResourceItems([resourceProps])
				.build();
			archive = new AdmZip(buffer);
		});

		it('should create an assignment folder', () => {
			const assignmentFolder = archive.getEntry(assignmentProps.identifier);

			expect(assignmentFolder).toBeDefined();
		});

		it('should create an assignment manifest which contains title and description', () => {
			const assignmentManifestFile = archive.getEntry(`${assignmentProps.identifier}/assignment.xml`);
			const assignmentManifest = assignmentManifestFile?.getData().toString();

			expect(assignmentManifestFile).toBeDefined();
			expect(assignmentManifestFile).toBeDefined();
			expect(assignmentManifest).toContain(`${assignmentProps.title}`);
			expect(assignmentManifest).toContain(`${assignmentProps.description}`);
		});

		it('should add the html file as resource the ims manifest file', () => {
			const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

			expect(manifest).toContain(assignmentProps.identifier);
		});
	});
});
