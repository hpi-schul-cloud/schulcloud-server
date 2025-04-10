import { Test, TestingModule } from '@nestjs/testing';
import { MediumMetadataLogoService } from './medium-metadata-logo.service';

describe(MediumMetadataLogoService.name, () => {
	let module: TestingModule;
	let service: MediumMetadataLogoService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [MediumMetadataLogoService],
		}).compile();

		service = module.get(MediumMetadataLogoService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('detectAndValidateLogoImageType', () => {
		describe('when unsupported image type', () => {
			const setup = () => {
				const image = 'unsupportedImageType';
				return { image };
			};

			it('should return undefined', () => {
				const { image } = setup();

				const result = service.detectAndValidateLogoImageType(image);

				expect(result).toBeUndefined();
			});
		});

		describe('when valid base64 image', () => {
			const setup = () => {
				const image = 'iVBORw0KGgoAAAANSUhEUgAAAAUA';
				const expectedContentType = 'image/png';
				return { image, expectedContentType };
			};

			it('should return the content type', () => {
				const { image, expectedContentType } = setup();

				const result = service.detectAndValidateLogoImageType(image);

				expect(result).toBe(expectedContentType);
			});
		});
	});
});
