import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import AdmZip from 'adm-zip';
import { readFile } from 'node:fs/promises';
import { CommonCartridgeFileValidatorPipe } from './common-cartridge-file-validator.pipe';

describe('CommonCartridgeFileValidatorPipe', () => {
	let module: TestingModule;
	let sut: CommonCartridgeFileValidatorPipe;
	let configServiceMock: DeepMocked<ConfigService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeFileValidatorPipe,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();
		sut = module.get(CommonCartridgeFileValidatorPipe);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('transform', () => {
		describe('when the file is valid', () => {
			const setup = async () => {
				const archive = new AdmZip();
				const buffer = await readFile('./apps/server/src/modules/common-cartridge/testing/assets/v1.1.0/manifest.xml');

				archive.addFile('imsmanifest.xml', buffer);
				configServiceMock.getOrThrow.mockReturnValue(1000);

				return {
					file: { size: 1000, buffer: archive.toBuffer() } as unknown as Express.Multer.File,
				};
			};

			it('should return the file', async () => {
				const { file } = await setup();

				expect(sut.transform(file)).toBe(file);
			});
		});

		describe('when no file is provided', () => {
			const setup = () => {
				return { file: undefined as unknown as Express.Multer.File };
			};

			it('should throw', () => {
				const { file } = setup();

				expect(() => sut.transform(file)).toThrow('No file uploaded');
			});
		});

		describe('when the file is too big', () => {
			const setup = () => {
				configServiceMock.getOrThrow.mockReturnValue(1000);

				return { file: { size: 1001 } as unknown as Express.Multer.File };
			};

			it('should throw', () => {
				const { file } = setup();

				expect(() => sut.transform(file)).toThrow('File is too large');
			});
		});

		describe('when the file is not a zip archive', () => {
			const setup = () => {
				configServiceMock.getOrThrow.mockReturnValue(1000);

				return {
					file: { size: 1000, buffer: Buffer.from('') } as unknown as Express.Multer.File,
				};
			};

			it('should throw', () => {
				const { file } = setup();

				expect(() => sut.transform(file)).toThrow('File is not a zip archive');
			});
		});
	});
});
