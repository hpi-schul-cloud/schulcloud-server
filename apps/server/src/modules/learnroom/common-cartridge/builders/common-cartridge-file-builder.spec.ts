import AdmZip from 'adm-zip';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeMetadataElementProps } from '../elements/common-cartridge-metadata-element';
import { CommonCartridgeResourceProps } from '../resources/common-cartridge-resource-factory';
import { OmitVersion } from '../utils';
import { CommonCartridgeFileBuilder, CommonCartridgeFileBuilderProps } from './common-cartridge-file-builder';
import { CommonCartridgeOrganizationBuilderOptions } from './common-cartridge-organization-builder';

describe('CommonCartridgeFileBuilder', () => {
	let sut: CommonCartridgeFileBuilder;
	let archive: AdmZip;

	const getFileContentAsString = (zip: AdmZip, path: string): string | undefined =>
		zip.getEntry(path)?.getData().toString();
	const fileBuilderOptions: CommonCartridgeFileBuilderProps = {
		version: CommonCartridgeVersion.V_1_1_0,
		identifier: 'manifest-identifier',
	};
	const metadataProps: OmitVersion<CommonCartridgeMetadataElementProps> = {
		title: 'metadata-title',
		creationDate: new Date(),
		copyrightOwners: ['John Doe', 'Jane Doe'],
	};
	const organizationOptions: OmitVersion<CommonCartridgeOrganizationBuilderOptions> = {
		title: 'organization-title',
		identifier: 'organization-identifier',
	};
	const subOrganizationOptions: OmitVersion<CommonCartridgeOrganizationBuilderOptions> = {
		title: 'sub-organization-title',
		identifier: 'sub-organization-identifier',
	};
	const subSubOrganizationOptions: OmitVersion<CommonCartridgeOrganizationBuilderOptions> = {
		title: 'sub-sub-organization-title',
		identifier: 'sub-sub-organization-identifier',
	};
	const resource1Props: CommonCartridgeResourceProps = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'resource-1-identifier',
		title: 'resource-1-title',
		html: '<p>resource-1-html</p>',
	};
	const resource2Props: CommonCartridgeResourceProps = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'resource-2-identifier',
		title: 'resource-2-title',
		html: '<p>resource-2-html</p>',
	};
	const resource3Props: CommonCartridgeResourceProps = {
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
					.addOrganization(organizationOptions)
					.addResource(resource1Props)
					.addSubOrganization(subOrganizationOptions)
					.addResource(resource2Props)
					.addSubOrganization(subSubOrganizationOptions)
					.addResource(resource3Props);

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
