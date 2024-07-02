import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { of, throwError } from 'rxjs';
import { ToolConfig } from '../../tool-config';
import { ExternalTool } from '../domain';
import { ExternalToolLogo } from '../domain/external-tool-logo';
import {
	ExternalToolLogoFetchedLoggable,
	ExternalToolLogoFetchFailedLoggableException,
	ExternalToolLogoNotFoundLoggableException,
	ExternalToolLogoSizeExceededLoggableException,
	ExternalToolLogoWrongFileTypeLoggableException,
} from '../loggable';
import { externalToolFactory } from '../testing';
import { ExternalToolLogoService } from './external-tool-logo.service';
import { ExternalToolService } from './external-tool.service';

describe(ExternalToolLogoService.name, () => {
	let module: TestingModule;
	let service: ExternalToolLogoService;

	let httpService: DeepMocked<HttpService>;
	let logger: DeepMocked<Logger>;
	let configService: DeepMocked<ConfigService<ToolConfig, true>>;
	let externalToolService: DeepMocked<ExternalToolService>;

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
					provide: ConfigService,
					useValue: createMock<ConfigService<ToolConfig, true>>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolLogoService);
		httpService = module.get(HttpService);
		logger = module.get(Logger);
		configService = module.get(ConfigService);
		externalToolService = module.get(ExternalToolService);
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
				configService.get.mockReturnValue(baseUrl);
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
					configService.get.mockReturnValue(1);

					return { externalTool };
				};

				it('should throw an error', () => {
					const { externalTool } = setup();

					const func = () => service.validateLogoSize(externalTool);

					expect(func).toThrow(ExternalToolLogoSizeExceededLoggableException);
				});
			});

			describe('when size is not exceeded', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.withBase64Logo().build();
					configService.get.mockReturnValue(30000);

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

				const func = () => service.validateLogoSize(externalTool);

				expect(func).not.toThrow();
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

		describe('when tool has a logo url', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().buildWithId();
				const base64Logo = externalTool.logo as string;
				const logoBuffer: Buffer = Buffer.from(base64Logo, 'base64');

				httpService.get.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: logoBuffer,
							status: HttpStatus.OK,
							statusText: 'OK',
						})
					)
				);

				const logoUrl = 'https://logo.com/';

				return {
					externalTool,
					base64Logo,
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

				expect(logger.info).toHaveBeenCalledWith(new ExternalToolLogoFetchedLoggable(logoUrl));
			});

			it('should return base64 encoded logo', async () => {
				const { externalTool, base64Logo } = setup();

				const logo: string | undefined = await service.fetchLogo(externalTool);

				expect(logo).toBe(base64Logo);
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

				const func = () => service.fetchLogo(externalTool);

				await expect(func()).rejects.toEqual(
					new ExternalToolLogoFetchFailedLoggableException(externalTool.logoUrl as string, HttpStatus.NOT_FOUND)
				);
			});
		});

		describe('when error occurs on fetching logo because of an wrong file type', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				httpService.get.mockReturnValue(throwError(() => new ExternalToolLogoWrongFileTypeLoggableException()));

				return {
					externalTool,
				};
			};

			it('should throw error', async () => {
				const { externalTool } = setup();

				const func = () => service.fetchLogo(externalTool);

				await expect(func()).rejects.toEqual(new ExternalToolLogoWrongFileTypeLoggableException());
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

				const func = () => service.fetchLogo(externalTool);

				await expect(func()).rejects.toEqual(
					new ExternalToolLogoFetchFailedLoggableException(externalTool.logoUrl as string)
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

				const func = () => service.fetchLogo(externalTool);

				await expect(func()).rejects.toThrow(ExternalToolLogoFetchFailedLoggableException);
			});
		});
	});

	describe('getExternalToolBinaryLogo', () => {
		describe('when logoBase64 is available', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().buildWithId();

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					externalToolId: externalTool.id,
					base64logo: externalTool.logo as string,
				};
			};

			it('should return ExternalToolLogo with proper properties', async () => {
				const { externalToolId, base64logo } = setup();

				const result: ExternalToolLogo = await service.getExternalToolBinaryLogo(externalToolId);

				expect(result).toEqual(
					new ExternalToolLogo({
						contentType: 'image/png',
						logo: Buffer.from(base64logo, 'base64'),
					})
				);
			});
		});

		describe('when logo has the wrong file type', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ logo: 'notAValidBase64File' });

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					externalToolId: externalTool.id,
				};
			};

			it('should throw an ExternalToolLogoWrongFileTypeLoggableException', async () => {
				const { externalToolId } = setup();

				const result: Promise<ExternalToolLogo> = service.getExternalToolBinaryLogo(externalToolId);

				await expect(result).rejects.toThrow(ExternalToolLogoWrongFileTypeLoggableException);
			});
		});

		describe('when logoBase64 is not available', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					externalToolId: externalTool.id,
				};
			};

			it('should throw ExternalToolLogoNotFoundLoggableException', async () => {
				const { externalToolId } = setup();

				const func = async () => service.getExternalToolBinaryLogo(externalToolId);

				await expect(func).rejects.toThrow(ExternalToolLogoNotFoundLoggableException);
			});
		});
	});
});
