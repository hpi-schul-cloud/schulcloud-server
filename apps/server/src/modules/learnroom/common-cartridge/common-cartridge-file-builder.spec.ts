import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import { CommonCartridgeFileBuilder, ICommonCartridgeFileBuilderOptions } from './common-cartridge-file-builder';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from './common-cartridge-enums';
import { ICommonCartridgeOrganizationProps } from './common-cartridge-organization-item-element';
import { ICommonCartridgeResourceProps } from './common-cartridge-resource-item-element';
import { CommonCartridgeAssignmentResourceItemElement } from './common-cartridge-assignment-resource-item-element';

describe('CommonCartridgeFileBuilder', () => {
	let archive: AdmZip;

	const getFileContentAsString = (path: string): string | undefined => archive.getEntry(path)?.getData().toString();
	const fileBuilderOptions: ICommonCartridgeFileBuilderOptions = {
		identifier: 'file-identifier',
		title: 'file-title',
	};
	const organizationProps: ICommonCartridgeOrganizationProps = {
		version: CommonCartridgeVersion.V_1_1_0,
		identifier: 'organization-identifier',
		title: 'organization-title',
		resources: [],
	};
	const ltiResourceProps: ICommonCartridgeResourceProps = {
		version: CommonCartridgeVersion.V_1_1_0,
		type: CommonCartridgeResourceType.LTI,
		identifier: 'lti-identifier',
		href: 'lti-identifier/lti.xml',
		title: 'lti-title',
		description: 'lti-description',
		url: 'https://to-a-lti-tool.tld',
	};
	const webContentResourceProps: ICommonCartridgeResourceProps = {
		version: CommonCartridgeVersion.V_1_1_0,
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'web-content-identifier',
		href: 'web-content-identifier/web-content.html',
		title: 'web-content-title',
		html: '<h1>Text Resource Title</h1><p>Text Resource Description</p>',
	};
	const webLinkResourceProps: ICommonCartridgeResourceProps = {
		version: CommonCartridgeVersion.V_1_1_0,
		type: CommonCartridgeResourceType.WEB_LINK,
		identifier: 'web-content-identifier',
		href: 'web-content-identifier/web-content.xml',
		title: 'web-link-title',
		url: 'https://to-a-web-link.tld',
	};

	beforeAll(async () => {
		const fileBuilder = new CommonCartridgeFileBuilder(fileBuilderOptions).addResourceToFile(webContentResourceProps);
		fileBuilder
			.addOrganization(organizationProps)
			.addResourceToOrganization(ltiResourceProps)
			.addResourceToOrganization(webLinkResourceProps);

		archive = new AdmZip(await fileBuilder.build());
	});

	describe('addOrganization', () => {
		describe('when adding an organization to the common cartridge file', () => {
			it('should add organization to manifest', () => {
				const manifest = getFileContentAsString('imsmanifest.xml');
				expect(manifest).toContain(organizationProps.identifier);
				expect(manifest).toContain(organizationProps.title);
			});
		});

		describe('when adding a resource to an organization', () => {
			it('should add resource to organization', () => {
				const manifest = getFileContentAsString('imsmanifest.xml');
				expect(manifest).toContain(`<title>${ltiResourceProps.title}</title>`);
			});

			it('should add resource to manifest', () => {
				const manifest = getFileContentAsString('imsmanifest.xml');
				expect(manifest).toContain(`<file href="${ltiResourceProps.href}"/>`);
			});

			it('should create corresponding resource file in archive', () => {
				expect(getFileContentAsString(ltiResourceProps.href)).toBeTruthy();
			});
		});
	});

	describe('addResourceToFile', () => {
		describe('when adding a resource to the common cartridge file', () => {
			it('should add resource to manifest', () => {
				const manifest = getFileContentAsString('imsmanifest.xml');
				expect(manifest).toContain(webContentResourceProps.identifier);
				expect(manifest).toContain(`<file href="${webContentResourceProps.href}"/>`);
				expect(manifest).not.toContain(webContentResourceProps.title);
			});

			it('should create corresponding file in archive', () => {
				expect(getFileContentAsString(webContentResourceProps.href)).toBeTruthy();
			});
		});
	});

	describe('build', () => {
		describe('when creating common cartridge archive', () => {
			it('should create manifest file at archive root', () => {
				const manifest = getFileContentAsString('imsmanifest.xml');
				expect(manifest).toBeTruthy();
			});

			it('should create valid manifest file', async () => {
				const manifest = getFileContentAsString('imsmanifest.xml');
				await expect(parseStringPromise(manifest as string)).resolves.not.toThrow();
			});

			it('should use common cartridge version 1.1.0', () => {
				const manifest = getFileContentAsString('imsmanifest.xml');
				expect(manifest).toContain(CommonCartridgeVersion.V_1_1_0);
			});
		});
	});

	describe('some tests for coverage reasons', () => {
		// it('throw if resource type is unknown', () => {
		// 	expect(() => new CommonCartridgeResourceItemElement({} as ICommonCartridgeResourceProps, {})).toThrow();
		// });

		it('should cover CommonCartridgeResourceItemElement', () => {
			const element = new CommonCartridgeAssignmentResourceItemElement({
				href: 'href',
				identifier: 'identifier',
				type: 'type',
			});
			expect(() => element.transform()).not.toThrow();
		});
	});
});
