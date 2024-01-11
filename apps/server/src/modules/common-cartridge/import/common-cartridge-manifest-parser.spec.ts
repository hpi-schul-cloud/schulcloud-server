import AdmZip from 'adm-zip';
import { readFile } from 'fs/promises';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';

describe('CommonCartridgeManifestParser', () => {
	const setup = async () => {
		const buffer = await readFile('./apps/server/test/assets/common-cartridge/us_history_since_1877.imscc');
		const archive = new AdmZip(buffer);
		const sut = new CommonCartridgeManifestParser(archive.readAsText('imsmanifest.xml'));

		return { sut };
	};

	describe('getSchema', () => {
		describe('when schema is present', () => {
			it('should return the schema', async () => {
				const { sut } = await setup();
				const result = sut.getSchema();

				expect(result).toBe('IMS Common Cartridge');
			});
		});
	});

	describe('getVersion', () => {
		describe('when version is present', () => {
			it('should return the version', async () => {
				const { sut } = await setup();
				const result = sut.getVersion();

				expect(result).toBe('1.3.0');
			});
		});
	});

	describe('getTitle', () => {
		describe('when title is present', () => {
			it('should return the title', async () => {
				const { sut } = await setup();
				const result = sut.getTitle();

				expect(result).toBe('201510-AMH-2020-70C-12218-US History Since 1877');
			});
		});
	});
});
