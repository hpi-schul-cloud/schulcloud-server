import { Logger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolLogoSanitizationLoggableException } from '../loggable';
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
			const validSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>`;
			const maliciousSvg = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="400" height="200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect x="10" y="10" width="100" height="100" fill="blue" /><image x="120" y="10" width="100" height="100" xlink:href="http://example.com/image.png" /><script type="text/javascript">alert("This is a script!");</script><circle cx="300" cy="60" r="50" fill="red" onclick="alert('Clicked!')" /><foreignObject x="10" y="120" width="300" height="60"><body xmlns="http://www.w3.org/1999/xhtml"><p>This is a foreignObject with HTML content.</p></body></foreignObject></svg>`;

			return {
				maliciousSvg,
				validSvg,
			};
		};
		it('should return sanitized SVG for valid input', () => {
			const { validSvg } = setup();
			const result = service.sanitizeSvg(validSvg);
			expect(result).toBe(validSvg);
		});

		it('should throw exception for empty string input', () => {
			expect(() => service.sanitizeSvg('')).toThrow(ExternalToolLogoSanitizationLoggableException);
		});

		it('should throw exception for whitespace-only input', () => {
			expect(() => service.sanitizeSvg('   ')).toThrow(ExternalToolLogoSanitizationLoggableException);
		});

		it('should throw exception for null input', () => {
			// @ts-expect-error: testing runtime behavior
			expect(() => service.sanitizeSvg(null)).toThrow(ExternalToolLogoSanitizationLoggableException);
		});

		it('should throw exception if sanitizer returns empty string', () => {
			const { validSvg } = setup();
			jest.spyOn(service['sanitizer'], 'sanitize').mockReturnValue('');
			expect(() => service.sanitizeSvg(validSvg)).toThrow(ExternalToolLogoSanitizationLoggableException);
		});

		it('should throw exception if sanitizer throws error', () => {
			const { validSvg } = setup();
			jest.spyOn(service['sanitizer'], 'sanitize').mockImplementation(() => {
				throw new Error('Sanitizer failed');
			});
			expect(() => service.sanitizeSvg(validSvg)).toThrow(ExternalToolLogoSanitizationLoggableException);
		});

		it('should sanitize and remove unsafe elements from malicious SVG', () => {
			const { maliciousSvg } = setup();

			const result = service.sanitizeSvg(maliciousSvg);

			expect(result).toContain('<svg');
			expect(result).toContain('<rect');
			expect(result).not.toContain('<script');
			expect(result).not.toContain('onclick');
			expect(result).not.toContain('<foreignObject');
			expect(result).not.toContain('<image');
		});
	});
});
