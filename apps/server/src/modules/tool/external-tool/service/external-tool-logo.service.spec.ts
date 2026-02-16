import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { of, throwError } from 'rxjs';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';
import { ExternalTool } from '../domain';
import { ExternalToolLogo } from '../domain/external-tool-logo';
import {
	ExternalToolLogoFetchedLoggable,
	ExternalToolLogoFetchFailedLoggableException,
	ExternalToolLogoNotFoundLoggableException,
	ExternalToolLogoSanitizationLoggableException,
	ExternalToolLogoSizeExceededLoggableException,
	ExternalToolLogoWrongFileTypeLoggableException,
	ExternalToolLogoWrongFormatLoggableException,
} from '../loggable';
import { base64TestLogo, externalToolFactory } from '../testing';
import {
	invalidSvgTestLogo,
	invalidSvgTestLogoBase64,
	invalidSvgTestLogoNotSvgBase64,
	sanitizedInvalidSvgTestLogo,
	sanitizedInvalidSvgTestLogoBase64,
	validSvgTestLogo,
	validSvgTestLogoBase64,
} from '../testing/svg-test-logos';
import { ExternalToolLogoSanitizerService } from './external-tool-logo-sanitizer.service';
import { ExternalToolLogoService } from './external-tool-logo.service';
import { ExternalToolService } from './external-tool.service';

describe(ExternalToolLogoService.name, () => {
	let module: TestingModule;
	let service: ExternalToolLogoService;

	let httpService: DeepMocked<HttpService>;
	let logger: DeepMocked<Logger>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let externalToolImageSanitizerService: DeepMocked<ExternalToolLogoSanitizerService>;
	let config: ToolConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolLogoService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: ExternalToolLogoSanitizerService,
					useValue: createMock<ExternalToolLogoSanitizerService>(),
				},
				{
					provide: TOOL_CONFIG_TOKEN,
					useValue: {},
				},
			],
		}).compile();

		service = module.get(ExternalToolLogoService);
		httpService = module.get(HttpService);
		logger = module.get(Logger);
		config = module.get(TOOL_CONFIG_TOKEN);
		externalToolService = module.get(ExternalToolService);
		externalToolImageSanitizerService = module.get(ExternalToolLogoSanitizerService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('buildLogoUrl', () => {
		describe('when externalTool has no logo', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				return {
					externalTool,
				};
			};

			it('should return undefined', () => {
				const { externalTool } = setup();

				const logoUrl = service.buildLogoUrl(externalTool);

				expect(logoUrl).toBeUndefined();
			});
		});

		describe('when externalTool has a logo', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().buildWithId();

				const baseUrl = 'https://backend.com';
				config.ctlToolsBackendUrl = baseUrl;
				const { id } = externalTool;
				const expected = `${baseUrl}/v3/tools/external-tools/${id}/logo`;

				return {
					externalTool,
					expected,
				};
			};

			it('should return an internal logoUrl', () => {
				const { externalTool, expected } = setup();

				const logoUrl = service.buildLogoUrl(externalTool);

				expect(logoUrl).toEqual(expected);
			});
		});
	});

	describe('validateLogoSize', () => {
		describe('when external tool has a given base64 logo', () => {
			describe('when size is exceeded', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.withBase64Logo().build();
					config.ctlToolsExternalToolMaxLogoSizeInBytes = 1;

					return { externalTool };
				};

				it('should throw an error', () => {
					const { externalTool } = setup();

					expect(() => service.validateLogoSize(externalTool)).toThrow(ExternalToolLogoSizeExceededLoggableException);
				});
			});

			describe('when size is not exceeded', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.withBase64Logo().build();
					config.ctlToolsExternalToolMaxLogoSizeInBytes = 300000;

					return { externalTool };
				};

				it('should not throw an error', () => {
					const { externalTool } = setup();

					const func = () => service.validateLogoSize(externalTool);

					expect(func).not.toThrow();
				});
			});
		});

		describe('when external tool has no given logo', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build();

				return { externalTool };
			};

			it('should not throw an error', () => {
				const { externalTool } = setup();

				expect(() => service.validateLogoSize(externalTool)).not.toThrow();
			});
		});
	});

	describe('fetchLogo', () => {
		describe('when tool has no logo url', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ logoUrl: undefined });

				return {
					externalTool,
				};
			};

			it('should not fetch the logo', async () => {
				const { externalTool } = setup();

				const logo = await service.fetchLogo(externalTool);

				expect(logo).toBeUndefined();
			});
		});

		describe('when tool has a normal logo url', () => {
			const setup = () => {
				const logoUrl = 'https://test.com/logo.png';
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					logoUrl,
				});
				const logoBuffer: Buffer = Buffer.from(base64TestLogo, 'base64');

				httpService.get.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: logoBuffer,
							status: HttpStatus.OK,
							statusText: 'OK',
							headers: {
								'content-type': 'image/png',
							},
						})
					)
				);

				return {
					externalTool,
					logoUrl,
				};
			};

			it('should fetch logo', async () => {
				const { externalTool, logoUrl } = setup();

				await service.fetchLogo(externalTool);

				expect(httpService.get).toHaveBeenCalledWith(logoUrl, { responseType: 'arraybuffer' });
			});

			it('should log the fetched url', async () => {
				const { externalTool, logoUrl } = setup();

				await service.fetchLogo(externalTool);

				expect(logger.debug).toHaveBeenCalledWith(new ExternalToolLogoFetchedLoggable(logoUrl));
			});

			it('should return base64 encoded logo', async () => {
				const { externalTool } = setup();

				const logo: string | undefined = await service.fetchLogo(externalTool);

				expect(logo).toBe(`data:image/png;base64,${base64TestLogo}`);
			});
		});

		describe('when tool has a svg logo url', () => {
			const setup = () => {
				const logoUrl = 'https://test.com/logo.svg';
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					logoUrl,
				});
				const logoBuffer: Buffer = Buffer.from(validSvgTestLogoBase64, 'base64');

				httpService.get.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: logoBuffer,
							status: HttpStatus.OK,
							statusText: 'OK',
							headers: {
								'content-type': 'image/svg+xml',
							},
						})
					)
				);
				externalToolImageSanitizerService.sanitizeSvg.mockReturnValue(validSvgTestLogo);
				return {
					externalTool,
					logoUrl,
				};
			};

			it('should return base64 encoded logo', async () => {
				const { externalTool } = setup();

				const logo: string | undefined = await service.fetchLogo(externalTool);

				expect(logo).toBe(`data:image/svg+xml;base64,${validSvgTestLogoBase64}`);
			});
		});

		describe('when tool has a corrupt svg logo', () => {
			const setup = () => {
				const logoUrl = 'https://test.com/logo.svg';
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					logoUrl,
				});
				const logoBuffer: Buffer = Buffer.from(invalidSvgTestLogoBase64, 'base64');

				httpService.get.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: logoBuffer,
							status: HttpStatus.OK,
							statusText: 'OK',
							headers: {
								'content-type': 'image/svg+xml',
							},
						})
					)
				);
				externalToolImageSanitizerService.sanitizeSvg.mockReturnValue(sanitizedInvalidSvgTestLogo);
				return {
					externalTool,
					logoUrl,
				};
			};

			it('should call sanitizer service', async () => {
				const { externalTool } = setup();

				await service.fetchLogo(externalTool);

				expect(externalToolImageSanitizerService.sanitizeSvg).toHaveBeenCalledWith(invalidSvgTestLogo);
			});

			it('should return sanitized base64 encoded logo', async () => {
				const { externalTool } = setup();

				const logo: string | undefined = await service.fetchLogo(externalTool);

				expect(logo).toBe(`data:image/svg+xml;base64,${sanitizedInvalidSvgTestLogoBase64}`);
			});
		});

		describe('when tool has a data url as logo url', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					logoUrl: `data:image/png;base64,${base64TestLogo}`,
				});
				const logoBuffer: Buffer = Buffer.from(base64TestLogo, 'base64');

				httpService.get.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: logoBuffer,
							status: HttpStatus.OK,
							statusText: 'OK',
						})
					)
				);

				return {
					externalTool,
				};
			};

			it('should return base64 encoded logo', async () => {
				const { externalTool } = setup();

				const logo: string | undefined = await service.fetchLogo(externalTool);

				expect(logo).toBe(`data:image/png;base64,${base64TestLogo}`);
			});
		});

		describe('when error occurs on fetching logo because of an http exception', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				httpService.get.mockReturnValue(
					throwError(() => new HttpException('Failed to fetch logo', HttpStatus.NOT_FOUND))
				);

				return {
					externalTool,
				};
			};

			it('should throw error', async () => {
				const { externalTool } = setup();

				await expect(service.fetchLogo(externalTool)).rejects.toEqual(
					new ExternalToolLogoFetchFailedLoggableException(externalTool.logoUrl as string, HttpStatus.NOT_FOUND)
				);
			});
		});

		describe('when error occurs on fetching logo because of an wrong file type', () => {
			const setup = () => {
				const base64 = 'Y29uc29sZS5sb2coIkhlbGxvIFdvcmxkIik7';
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					logoUrl: `data:image/javascript;base64,${base64}`,
				});

				httpService.get.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: base64,
							status: HttpStatus.OK,
							statusText: 'OK',
						})
					)
				);

				return {
					externalTool,
				};
			};

			it('should throw error', async () => {
				const { externalTool } = setup();

				await expect(service.fetchLogo(externalTool)).rejects.toThrow(ExternalToolLogoWrongFileTypeLoggableException);
			});
		});

		describe('when error occurs on fetching svg logo because fetched svg is empty', () => {
			const setup = () => {
				const logoUrl = 'https://test.com/logo.svg';
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					logoUrl,
				});
				const logoBuffer: Buffer = Buffer.from('', 'base64');

				jest.spyOn(externalToolImageSanitizerService, 'sanitizeSvg').mockImplementation(() => {
					throw new ExternalToolLogoSanitizationLoggableException(
						'SVG sanitization falied: SVG to be sanitized is invalid.'
					);
				});
				httpService.get.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: logoBuffer,
							status: HttpStatus.OK,
							statusText: 'OK',
							headers: {
								'content-type': 'image/svg+xml',
							},
						})
					)
				);

				return {
					externalTool,
					logoUrl,
				};
			};

			it('should throw error', async () => {
				const { externalTool } = setup();

				await expect(service.fetchLogo(externalTool)).rejects.toEqual(
					new ExternalToolLogoSanitizationLoggableException('SVG sanitization falied: SVG to be sanitized is invalid.')
				);
			});
		});

		describe('when error occurs on fetching svg logo because sanitized logo is empty', () => {
			const setup = () => {
				const logoUrl = 'https://test.com/logo.svg';
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					logoUrl,
				});
				const logoBuffer: Buffer = Buffer.from(invalidSvgTestLogoNotSvgBase64, 'base64');

				httpService.get.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: logoBuffer,
							status: HttpStatus.OK,
							statusText: 'OK',
							headers: {
								'content-type': 'image/svg+xml',
							},
						})
					)
				);

				jest.spyOn(externalToolImageSanitizerService, 'sanitizeSvg').mockImplementation(() => {
					throw new ExternalToolLogoSanitizationLoggableException('SVG sanitization falied: Sanitized SVG is invalid.');
				});
				return {
					externalTool,
					logoUrl,
				};
			};

			it('should throw error', async () => {
				const { externalTool } = setup();

				await expect(service.fetchLogo(externalTool)).rejects.toEqual(
					new ExternalToolLogoSanitizationLoggableException('SVG sanitization falied: Sanitized SVG is invalid.')
				);
			});
		});

		describe('when error occurs on fetching logo because of another error', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				httpService.get.mockReturnValue(throwError(() => new Error('Failed to fetch logo')));

				return {
					externalTool,
				};
			};

			it('should throw error', async () => {
				const { externalTool } = setup();

				await expect(service.fetchLogo(externalTool)).rejects.toEqual(
					new ExternalToolLogoFetchFailedLoggableException(externalTool.logoUrl as string)
				);
			});
		});
	});

	describe('getExternalToolBinaryLogo', () => {
		describe('when logoBase64 is available', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().buildWithId();

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					externalTool,
				};
			};

			it('should return ExternalToolLogo with proper properties', async () => {
				const { externalTool } = setup();

				const result: ExternalToolLogo = await service.getExternalToolBinaryLogo(externalTool.id);

				expect(result).toEqual(
					new ExternalToolLogo({
						contentType: 'image/png',
						logo: Buffer.from(base64TestLogo, 'base64'),
					})
				);
			});
		});

		describe('when logo has the wrong file type', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ logo: 'notAValidBase64File' });

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					externalTool,
				};
			};

			it('should throw an ExternalToolLogoWrongFormatLoggableException', async () => {
				const { externalTool } = setup();

				await expect(service.getExternalToolBinaryLogo(externalTool.id)).rejects.toThrow(
					ExternalToolLogoWrongFormatLoggableException
				);
			});
		});

		describe('when logoBase64 is not available', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					externalTool,
				};
			};

			it('should throw ExternalToolLogoNotFoundLoggableException', async () => {
				const { externalTool } = setup();

				await expect(service.getExternalToolBinaryLogo(externalTool.id)).rejects.toThrow(
					ExternalToolLogoNotFoundLoggableException
				);
			});
		});
	});
});
