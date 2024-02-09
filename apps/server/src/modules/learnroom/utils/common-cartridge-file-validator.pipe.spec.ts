import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { readFile } from 'node:fs/promises';
import { LearnroomConfigService } from '../service';
import { CommonCartridgeFileValidatorPipe } from './common-cartridge-file-validator.pipe';

describe('CommonCartridgeFileValidatorPipe', () => {
	let module: TestingModule;
	let sut: CommonCartridgeFileValidatorPipe;
	let configServiceMock: DeepMocked<ConfigService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeFileValidatorPipe,
				LearnroomConfigService,
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
		describe('when no file is provided', () => {
			const setup = () => {
				return { file: undefined as unknown as Express.Multer.File };
			};

			it('should throw', () => {
				const { file } = setup();

				expect(() => sut.transform(file)).toThrow('No file uploaded');
			});
		});

		describe('when an invalid file type is provided', () => {
			const setup = () => {
				return { file: { mimetype: 'invalid' } as unknown as Express.Multer.File };
			};

			it('should throw', () => {
				const { file } = setup();

				expect(() => sut.transform(file)).toThrow('Invalid file type');
			});
		});

		describe('when the file is too big', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue(1000);

				return { file: { mimetype: 'application/zip', size: 1001 } as unknown as Express.Multer.File };
			};

			it('should throw', () => {
				const { file } = setup();

				expect(() => sut.transform(file)).toThrow('File too big');
			});
		});

		describe('when the file does not contain a manifest file', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue(1000);

				return {
					file: { mimetype: 'application/zip', size: 1000, buffer: Buffer.from('') } as unknown as Express.Multer.File,
				};
			};

			it('should throw', () => {
				const { file } = setup();

				expect(() => sut.transform(file)).toThrow('No manifest file found');
			});
		});

		describe('when the file is valid', () => {
			const setup = async () => {
				const buffer = await readFile('./apps/server/test/assets/common-cartridge/us_history_since_1877.imscc');

				configServiceMock.get.mockReturnValue(1000);

				return {
					file: { mimetype: 'application/zip', size: 1000, buffer } as unknown as Express.Multer.File,
				};
			};

			it('should return the file', async () => {
				const { file } = await setup();

				expect(sut.transform(file)).toBe(file);
			});
		});
	});
});
