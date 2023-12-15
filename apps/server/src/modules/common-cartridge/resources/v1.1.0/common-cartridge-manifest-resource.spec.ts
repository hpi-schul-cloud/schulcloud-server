import { readFile } from 'fs/promises';
import {
	CommonCartridgeElementType,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import { CommonCartridgeElementFactoryV110 } from '../../elements/v1.1.0/common-cartridge-element-factory';
import { CommonCartridgeResourceFactory } from '../common-cartridge-resource-factory';
import { CommonCartridgeManifestResourceV110 } from './common-cartridge-manifest-resource';

describe('CommonCartridgeManifestResourceV110', () => {
	const setup = () => {
		const resource1 = CommonCartridgeResourceFactory.createResource({
			type: CommonCartridgeResourceType.WEB_CONTENT,
			version: CommonCartridgeVersion.V_1_1_0,
			title: 'Title 1',
			identifier: 'r1',
			folder: 'o1',
			html: '<p>HTML</p>',
			intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
		});
		const resource2 = CommonCartridgeResourceFactory.createResource({
			type: CommonCartridgeResourceType.WEB_LINK,
			version: CommonCartridgeVersion.V_1_1_0,
			title: 'Title 2',
			identifier: 'r2',
			folder: 'o2',
			url: 'https://www.example.tld',
		});
		const organization1 = CommonCartridgeElementFactoryV110.getInstance().createElement({
			type: CommonCartridgeElementType.ORGANIZATION,
			version: CommonCartridgeVersion.V_1_1_0,
			title: 'Title 1',
			identifier: 'o1',
			items: [resource1],
		});
		const organization2 = CommonCartridgeElementFactoryV110.getInstance().createElement({
			type: CommonCartridgeElementType.ORGANIZATION,
			version: CommonCartridgeVersion.V_1_1_0,
			title: 'Title 2',
			identifier: 'o2',
			items: [resource2],
		});
		const metadata = CommonCartridgeElementFactoryV110.getInstance().createElement({
			type: CommonCartridgeElementType.METADATA,
			version: CommonCartridgeVersion.V_1_1_0,
			title: 'Common Cartridge Manifest',
			copyrightOwners: ['John Doe', 'Jane Doe'],
			creationDate: new Date('2023-01-01'),
		});
		const sut = new CommonCartridgeManifestResourceV110({
			type: CommonCartridgeResourceType.MANIFEST,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: 'm1',
			metadata,
			organizations: [organization1, organization2],
			resources: [resource1, resource2],
		});

		return { sut };
	};

	describe('canInline', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return false', () => {
				const { sut } = setup();
				const result = sut.canInline();

				expect(result).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return constructed file path', () => {
				const { sut } = setup();
				const result = sut.getFilePath();

				expect(result).toBe('imsmanifest.xml');
			});
		});
	});

	describe('getFileContent', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return constructed file content', async () => {
				const { sut } = setup();
				const expected = await readFile(
					'./apps/server/test/assets/common-cartridge/v1.1.0/manifest.xml',
					'utf-8'
				);
				const result = sut.getFileContent();

				expect(result).toEqual(expected);
			});
		});
	});

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return supported version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});
	});
});
