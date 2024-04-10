import { DeepMocked, createMock } from '@golevelup/ts-jest';
import AdmZip from 'adm-zip';
import { readFile } from 'node:fs/promises';
import { CommonCartridgeFileParser } from './common-cartridge-file-parser';
import { CommonCartridgeManifestParser } from './common-cartridge-manifest-parser';
import { CommonCartridgeManifestNotFoundException } from './utils/common-cartridge-manifest-not-found.exception';

describe('CommonCartridgeFileParser', () => {
	let sut: CommonCartridgeFileParser;
	let manifestParserMock: DeepMocked<CommonCartridgeManifestParser>;

	const setupFile = async (hasManifest: boolean) => {
		let file: Buffer;

		if (hasManifest) {
			const manifest = await readFile('./apps/server/src/modules/common-cartridge/testing/assets/v1.1.0/manifest.xml');
			const archive = new AdmZip();

			archive.addFile('imsmanifest.xml', manifest);

			file = archive.toBuffer();
		} else {
			file = new AdmZip().toBuffer();
		}

		return file;
	};

	const setupParser = async (hasManifest: boolean) => {
		const file = await setupFile(hasManifest);

		return new CommonCartridgeFileParser(file);
	};

	beforeAll(async () => {
		sut = await setupParser(true);
		manifestParserMock = createMock<CommonCartridgeManifestParser>();

		jest.spyOn(CommonCartridgeManifestParser.prototype, 'getSchema').mockReturnValue('IMS Common Cartridge');
		Reflect.set(sut, 'manifestParser', manifestParserMock);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		describe('when manifest file is found', () => {
			const setup = () => setupFile(true);

			it('should create instance', async () => {
				const file = await setup();

				expect(() => new CommonCartridgeFileParser(file)).not.toThrow();
			});
		});

		describe('when manifest file is not found', () => {
			const setup = () => setupFile(false);

			it('should throw CommonCartridgeManifestNotFoundException', async () => {
				const file = await setup();

				expect(() => new CommonCartridgeFileParser(file)).toThrow(CommonCartridgeManifestNotFoundException);
			});
		});
	});

	describe('getSchema', () => {
		describe('when schema is found', () => {
			const setup = () => setupParser(true);

			it('should return schema', async () => {
				const parser = await setup();

				const schema = parser.getSchema();

				expect(schema).toEqual('IMS Common Cartridge');
			});
		});

		describe('when schema is not found', () => {
			const setup = () => setupParser(true);

			it('should return undefined', async () => {
				const parser = await setup();

				const schema = parser.getSchema();

				expect(schema).toBeUndefined();
			});
		});
	});

	describe('getVersion', () => {
		describe('when version is found', () => {
			const setup = () => setupParser(true);

			it('should return version', async () => {
				const parser = await setup();

				const version = parser.getVersion();

				expect(version).toEqual('1.1.0');
			});
		});

		describe('when version is not found', () => {
			const setup = () => setupParser(true);

			it('should return undefined', async () => {
				const parser = await setup();

				const version = parser.getVersion();

				expect(version).toBeUndefined();
			});
		});
	});

	describe('getTitle', () => {
		describe('when title is found', () => {
			const setup = () => setupParser(true);

			it('should return title', async () => {
				const parser = await setup();

				const title = parser.getTitle();

				expect(title).toEqual('Common Cartridge Manifest');
			});
		});

		describe('when title is not found', () => {
			const setup = () => setupParser(true);

			it('should return undefined', async () => {
				const parser = await setup();

				const title = parser.getTitle();

				expect(title).toBeUndefined();
			});
		});
	});

	describe('getOrganizations', () => {});

	describe('getResource', () => {});

	describe('getResourceAsString', () => {});
});
