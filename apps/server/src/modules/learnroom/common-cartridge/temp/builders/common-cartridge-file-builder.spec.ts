import AdmZip from 'adm-zip';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeMetadataElementProps } from '../elements/common-cartridge-metadata-element';
import { CommonCartridgeResourceProps } from '../resources/common-cartridge-resource-factory';
import { CommonCartridgeFileBuilder, CommonCartridgeFileBuilderProps } from './common-cartridge-file-builder';
import { CommonCartridgeOrganizationBuilderOptions } from './common-cartridge-organization-builder';

describe('CommonCartridgeFileBuilder', () => {
	let sut: CommonCartridgeFileBuilder;
	let archive: AdmZip;

	const getFileContentAsString = (zip: AdmZip, path: string): string | undefined =>
		zip.getEntry(path)?.getData().toString();
	const fileBuilderOptions: CommonCartridgeFileBuilderProps = {
		version: CommonCartridgeVersion.V_1_1,
		identifier: 'manifest-identifier',
	};
	const metadataProps: Omit<CommonCartridgeMetadataElementProps, 'version'> = {
		title: 'metadata-title',
		creationDate: new Date(),
		copyrightOwners: ['John Doe', 'Jane Doe'],
	};
	const organizationProps: Omit<CommonCartridgeOrganizationBuilderOptions, 'version'> = {
		title: 'organization-title',
		identifier: 'organization-identifier',
	};
	const subOrganizationProps: Omit<CommonCartridgeOrganizationBuilderOptions, 'version'> = {
		title: 'sub-organization-title',
		identifier: 'sub-organization-identifier',
	};
	const subSubOrganizationProps: Omit<CommonCartridgeOrganizationBuilderOptions, 'version'> = {
		title: 'sub-sub-organization-title',
		identifier: 'sub-sub-organization-identifier',
	};
	const resource1: CommonCartridgeResourceProps = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'resource-1-identifier',
		title: 'resource-1-title',
		html: '<p>resource-1-html</p>',
	};
	const resource2: CommonCartridgeResourceProps = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'resource-2-identifier',
		title: 'resource-2-title',
		html: '<p>resource-2-html</p>',
	};
	const resource3: CommonCartridgeResourceProps = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'resource-3-identifier',
		title: 'resource-3-title',
		html: '<p>resource-3-html</p>',
	};

	describe('build', () => {
		describe('when creating a common cartridge archive', () => {
			beforeAll(async () => {
				sut = new CommonCartridgeFileBuilder(fileBuilderOptions);
				sut.addMetadata(metadataProps)
					.addOrganization(organizationProps)
					.addResource(resource1)
					.addSubOrganization(subOrganizationProps)
					.addResource(resource2)
					.addSubOrganization(subSubOrganizationProps)
					.addResource(resource3);

				archive = new AdmZip(await sut.build());
			});

			it('should create imsmanifest.xml in archive root', () => {
				const manifest = getFileContentAsString(archive, 'imsmanifest.xml');

				expect(manifest).toBeDefined();
			});

			it('should create resource in organization folder', () => {
				const resource = getFileContentAsString(archive, 'organization-identifier/resource-1-identifier.html');

				expect(resource).toBeDefined();
			});

			it('should create resource in sub-organization folder', () => {
				const resource = getFileContentAsString(
					archive,
					'organization-identifier/sub-organization-identifier/resource-2-identifier.html'
				);

				expect(resource).toBeDefined();
			});

			it('should create resource in sub-sub-organization folder', () => {
				const resource = getFileContentAsString(
					archive,
					'organization-identifier/sub-organization-identifier/sub-sub-organization-identifier/resource-3-identifier.html'
				);

				expect(resource).toBeDefined();
			});
		});
	});
});
