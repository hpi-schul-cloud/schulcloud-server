import { faker } from '@faker-js/faker';
import AdmZip from 'adm-zip';
import {
	CommonCartridgeElementType,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../common-cartridge.enums';
import { CommonCartridgeElementProps } from '../elements/common-cartridge-element-factory';
import { CommonCartridgeResourceProps } from '../resources/common-cartridge-resource-factory';
import { CommonCartridgeFileBuilder } from './common-cartridge-file-builder';
import { CommonCartridgeOrganizationBuilderOptions } from './common-cartridge-organization-builder';

describe('CommonCartridgeFileBuilder', () => {
	const getFileContentAsString = (zip: AdmZip, path: string): string | undefined =>
		zip.getEntry(path)?.getData().toString();

	describe('build', () => {
		describe('when a common cartridge archive has been created', () => {
			const setup = async () => {
				const metadataProps: CommonCartridgeElementProps = {
					type: CommonCartridgeElementType.METADATA,
					title: faker.lorem.words(),
					creationDate: new Date(),
					copyrightOwners: ['John Doe', 'Jane Doe'],
				};
				const organizationOptions: CommonCartridgeOrganizationBuilderOptions = {
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
				};
				const resourceProps: CommonCartridgeResourceProps = {
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: faker.string.uuid(),
					title: faker.lorem.words(),
					html: faker.lorem.paragraphs(),
					intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				};
				const builder = new CommonCartridgeFileBuilder({
					version: CommonCartridgeVersion.V_1_1_0,
					identifier: faker.string.uuid(),
				});

				builder
					.addMetadata(metadataProps)
					.addOrganization(organizationOptions)
					.addResource(resourceProps)
					.addSubOrganization(organizationOptions)
					.addResource(resourceProps)
					.addSubOrganization(organizationOptions)
					.addResource(resourceProps);

				const archive = new AdmZip(await builder.build());

				return { archive, metadataProps, organizationOptions, resourceProps };
			};

			it('should have a imsmanifest.xml in archive root', async () => {
				const { archive } = await setup();

				const manifest = getFileContentAsString(archive, 'imsmanifest.xml');

				expect(manifest).toBeDefined();
			});

			it('should have included the resource in organization folder', async () => {
				const { archive, organizationOptions, resourceProps } = await setup();

				const resource = getFileContentAsString(
					archive,
					`${organizationOptions.identifier}/${resourceProps.identifier}.html`
				);

				expect(resource).toBeDefined();
			});

			it('should have included the resource in sub-organization folder', async () => {
				const { archive, organizationOptions, resourceProps } = await setup();

				const resource = getFileContentAsString(
					archive,
					`${organizationOptions.identifier}/${organizationOptions.identifier}/${resourceProps.identifier}.html`
				);

				expect(resource).toBeDefined();
			});

			it('should have included the resource in sub-sub-organization folder', async () => {
				const { archive, organizationOptions, resourceProps } = await setup();

				const resource = getFileContentAsString(
					archive,
					`${organizationOptions.identifier}/${organizationOptions.identifier}/${organizationOptions.identifier}/${resourceProps.identifier}.html`
				);

				expect(resource).toBeDefined();
			});
		});

		describe('when metadata has not been provide', () => {
			const sut = new CommonCartridgeFileBuilder({
				version: CommonCartridgeVersion.V_1_1_0,
				identifier: faker.string.uuid(),
			});

			it('should throw an error', async () => {
				await expect(sut.build()).rejects.toThrow('Metadata is not defined');
			});
		});
	});
});
