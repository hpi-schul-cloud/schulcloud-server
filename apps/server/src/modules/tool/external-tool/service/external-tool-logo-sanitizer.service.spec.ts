import { Logger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolLogoSanitizationLoggableException } from '../loggable';
import { invalidSvgTestLogo, validSvgTestLogo } from '../testing';
import { ExternalToolLogoSanitizerService } from './external-tool-logo-sanitizer.service';

describe(ExternalToolLogoSanitizerService.name, () => {
	let module: TestingModule;
	let service: ExternalToolLogoSanitizerService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolLogoSanitizerService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolLogoSanitizerService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('sanitizeSvg', () => {
		const setup = () => {
			return {
				invalidSvgTestLogo,
				validSvgTestLogo,
			};
		};

		it('should return sanitized SVG for valid input', () => {
			const { validSvgTestLogo } = setup();
			const result = service.sanitizeSvg(validSvgTestLogo);
			expect(result).toContain('<svg');
		});

		it('should sanitize and remove image tag from malicious SVG', () => {
			const { invalidSvgTestLogo } = setup();

			const result = service.sanitizeSvg(invalidSvgTestLogo);

			expect(result).not.toContain('<image');
		});

		it('should sanitize and remove script tag from malicious SVG', () => {
			const { invalidSvgTestLogo } = setup();

			const result = service.sanitizeSvg(invalidSvgTestLogo);

			expect(result).not.toContain('<script');
		});

		it('should sanitize and remove onlick action from malicious SVG', () => {
			const { invalidSvgTestLogo } = setup();

			const result = service.sanitizeSvg(invalidSvgTestLogo);

			expect(result).not.toContain('onclick');
		});

		it('should sanitize and remove foreignObject from malicious SVG', () => {
			const { invalidSvgTestLogo } = setup();

			const result = service.sanitizeSvg(invalidSvgTestLogo);

			expect(result).not.toContain('<foreignObject');
		});

		it('should throw exception for empty string input', () => {
			expect(() => service.sanitizeSvg('')).toThrow(ExternalToolLogoSanitizationLoggableException);
		});

		it('should throw exception for whitespace-only input', () => {
			expect(() => service.sanitizeSvg('   ')).toThrow(ExternalToolLogoSanitizationLoggableException);
		});

		it('should throw exception if sanitizer returns empty string', () => {
			jest.spyOn(service['sanitizer'], 'sanitize').mockReturnValue('');
			expect(() => service.sanitizeSvg(validSvgTestLogo)).toThrow(ExternalToolLogoSanitizationLoggableException);
		});
	});
});
