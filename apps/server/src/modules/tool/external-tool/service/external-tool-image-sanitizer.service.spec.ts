import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolImageSanitizationLoggableException } from '../loggable';
import { ExternalToolImageSanitizerService } from './external-tool-image-sanitizer.service';

describe(ExternalToolImageSanitizerService.name, () => {
	let module: TestingModule;
	let service: ExternalToolImageSanitizerService;

	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolImageSanitizerService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolImageSanitizerService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('sanitizeSvgToBase64', () => {
		const setup = () => {
			const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>`;

			return {
				svgContent,
			};
		};

		it('should return base64-encoded data URI for valid SVG', () => {
			const { svgContent } = setup();
			const result = service.sanitizeSvgToBase64(svgContent);

			expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
			const decoded = Buffer.from(result.split(',')[1], 'base64').toString('utf-8');
			expect(decoded).toContain('<svg');
		});

		it('should throw exception for empty string input', () => {
			const svgContent = '';
			expect(() => service.sanitizeSvgToBase64(svgContent)).toThrow(ExternalToolImageSanitizationLoggableException);
			expect(logger.debug).toHaveBeenCalledWith(new ExternalToolImageSanitizationLoggableException());
		});

		it('should throw exception for non-string input', () => {
			// @ts-expect-error: testing runtime behavior
			expect(() => service.sanitizeSvgToBase64(null)).toThrow(ExternalToolImageSanitizationLoggableException);
			expect(logger.debug).toHaveBeenCalledWith(new ExternalToolImageSanitizationLoggableException());
		});

		it('should throw exception if DOMPurify returns empty string', () => {
			const svgContent = '<svg></svg>';

			expect(() => service.sanitizeSvgToBase64(svgContent)).toThrow(ExternalToolImageSanitizationLoggableException);
			expect(logger.debug).toHaveBeenCalledWith(new ExternalToolImageSanitizationLoggableException());
		});

		it('should throw exception if DOMPurify throws an error', () => {
			const svgContent = '<svg></svg>';

			expect(() => service.sanitizeSvgToBase64(svgContent)).toThrow(ExternalToolImageSanitizationLoggableException);
			expect(logger.debug).toHaveBeenCalledWith(new ExternalToolImageSanitizationLoggableException());
		});
	});
});
