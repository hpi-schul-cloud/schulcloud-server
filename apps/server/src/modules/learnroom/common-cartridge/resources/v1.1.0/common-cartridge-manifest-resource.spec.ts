import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { readFile } from 'fs/promises';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';
import { CommonCartridgeManifestResourceV110 } from './common-cartridge-manifest-resource';

describe('CommonCartridgeManifestResourceV110', () => {
	const setup = () => {
		const metadataMock = createMock<CommonCartridgeElement>();
		const sut = new CommonCartridgeManifestResourceV110({
			type: CommonCartridgeResourceType.MANIFEST,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			metadata: metadataMock,
			organizations: [],
			resources: [],
		});

		return { sut, metadataMock };
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
				const manifest = await readFile(
					'./apps/server/src/modules/learnroom/common-cartridge/resources/v1.1.0/imsmanifest.xml',
					'utf-8'
				);
				const result = sut.getFileContent();

				expect(result).toEqual(manifest);
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

	describe('getManifestXmlObject', () => {});
});
