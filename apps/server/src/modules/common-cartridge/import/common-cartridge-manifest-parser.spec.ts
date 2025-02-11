import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';
import { readFile } from 'fs/promises';
import { DEFAULT_FILE_PARSER_OPTIONS } from './common-cartridge-import.types';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';

describe('CommonCartridgeManifestParser', () => {
	let archive: AdmZip;

	const setupFile = (loadFile: boolean) => {
		if (!loadFile) {
			const manifest = cheerio.load('<manifest></manifest>', { xml: true });
			const sut = new CommonCartridgeManifestParser(manifest, DEFAULT_FILE_PARSER_OPTIONS);

			return { sut };
		}

		const xml = archive.readAsText('imsmanifest.xml');
		const manifest = cheerio.load(xml, { xml: true });
		const sut = new CommonCartridgeManifestParser(manifest, DEFAULT_FILE_PARSER_OPTIONS);

		return { sut };
	};

	beforeAll(async () => {
		const buffer = await readFile(
			'./apps/server/src/modules/common-cartridge/testing/assets/us_history_since_1877.zip'
		);

		archive = new AdmZip(buffer);
	});

	describe('getSchema', () => {
		describe('when schema is present', () => {
			const setup = () => setupFile(true);

			it('should return the schema', () => {
				const { sut } = setup();

				const result = sut.getSchema();

				expect(result).toBe('IMS Common Cartridge');
			});
		});

		describe('when schema is not present', () => {
			const setup = () => setupFile(false);

			it('should return undefined', () => {
				const { sut } = setup();

				const result = sut.getSchema();

				expect(result).toEqual('');
			});
		});
	});

	describe('getVersion', () => {
		describe('when version is present', () => {
			const setup = () => setupFile(true);

			it('should return the version', () => {
				const { sut } = setup();

				const result = sut.getVersion();

				expect(result).toBe('1.3.0');
			});
		});

		describe('when version is not present', () => {
			const setup = () => setupFile(false);

			it('should return undefined', () => {
				const { sut } = setup();

				const result = sut.getVersion();

				expect(result).toEqual('');
			});
		});
	});

	describe('getTitle', () => {
		describe('when title is present', () => {
			const setup = () => setupFile(true);

			it('should return the title', () => {
				const { sut } = setup();

				const result = sut.getTitle();

				expect(result).toBe('201510-AMH-2020-70C-12218-US History Since 1877');
			});
		});

		describe('when title is not present', () => {
			const setup = () => setupFile(false);

			it('should return null', () => {
				const { sut } = setup();

				const result = sut.getTitle();

				expect(result).toEqual('');
			});
		});
	});

	describe('getOrganizations', () => {
		describe('when organizations are present', () => {
			const setup = () => setupFile(true);

			it('should return the organization', () => {
				const { sut } = setup();

				const result = sut.getOrganizations();

				expect(result).toHaveLength(117);
			});
		});

		describe('when organizations are not present', () => {
			const setup = () => setupFile(false);

			it('should return empty list', () => {
				const { sut } = setup();

				const result = sut.getOrganizations();

				expect(result).toHaveLength(0);
			});
		});
	});
});
