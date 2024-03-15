import AdmZip from 'adm-zip';
import { readFile } from 'fs/promises';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';

describe('CommonCartridgeManifestParser', () => {
	const setupFile = async (loadFile: boolean) => {
		if (!loadFile) {
			const sut = new CommonCartridgeManifestParser('<manifest></manifest>');

			return { sut };
		}

		const buffer = await readFile(
			'./apps/server/src/modules/common-cartridge/testing/assets/us_history_since_1877.imscc'
		);
		const archive = new AdmZip(buffer);
		const sut = new CommonCartridgeManifestParser(archive.readAsText('imsmanifest.xml'));

		return { sut };
	};

	describe('getSchema', () => {
		describe('when schema is present', () => {
			const setup = async () => setupFile(true);

			it('should return the schema', async () => {
				const { sut } = await setup();
				const result = sut.getSchema();

				expect(result).toBe('IMS Common Cartridge');
			});
		});

		describe('when schema is not present', () => {
			const setup = async () => setupFile(false);

			it('should return undefined', async () => {
				const { sut } = await setup();
				const result = sut.getSchema();

				expect(result).toBeUndefined();
			});
		});
	});

	describe('getVersion', () => {
		describe('when version is present', () => {
			const setup = async () => setupFile(true);

			it('should return the version', async () => {
				const { sut } = await setup();
				const result = sut.getVersion();

				expect(result).toBe('1.3.0');
			});
		});

		describe('when version is not present', () => {
			const setup = async () => setupFile(false);

			it('should return undefined', async () => {
				const { sut } = await setup();
				const result = sut.getVersion();

				expect(result).toBeUndefined();
			});
		});
	});

	describe('getTitle', () => {
		describe('when title is present', () => {
			const setup = async () => setupFile(true);

			it('should return the title', async () => {
				const { sut } = await setup();
				const result = sut.getTitle();

				expect(result).toBe('201510-AMH-2020-70C-12218-US History Since 1877');
			});
		});

		describe('when title is not present', () => {
			const setup = async () => setupFile(false);

			it('should return null', async () => {
				const { sut } = await setup();
				const result = sut.getTitle();

				expect(result).toBeUndefined();
			});
		});
	});
});
