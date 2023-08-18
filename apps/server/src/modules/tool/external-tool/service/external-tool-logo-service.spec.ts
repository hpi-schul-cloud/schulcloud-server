import { of, throwError } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@src/core/logger';
import { externalToolFactory } from '@shared/testing';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import {
	ExternalToolLogoFetchedLoggable,
	ExternalToolLogoNotFoundLoggableException,
	ExternalToolLogoSizeExceededLoggableException,
} from '../loggable';
import { ExternalToolLogoService } from './external-tool-logo.service';
import { ExternalTool } from '../domain';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalToolService } from './external-tool.service';
import { ExternalToolLogo } from '../domain/external-tool-logo';

describe('ExternalToolLogoService', () => {
	let module: TestingModule;
	let service: ExternalToolLogoService;

	let httpService: DeepMocked<HttpService>;
	let logger: DeepMocked<Logger>;
	let toolFeatures: IToolFeatures;
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
					provide: ToolFeatures,
					useValue: {
						maxExternalToolLogoSizeInBytes: 30000,
					},
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
		toolFeatures = module.get(ToolFeatures);
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
				const logoUrlTemplate = '/v3/tools/external-tools/{id}/logo';

				return {
					externalTool,
					logoUrlTemplate,
				};
			};

			it('should return undefined', () => {
				const { externalTool, logoUrlTemplate } = setup();

				const logoUrl = service.buildLogoUrl(logoUrlTemplate, externalTool);

				expect(logoUrl).toBeUndefined();
			});
		});

		describe('when externalTool has a logo', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().buildWithId();
				const logoUrlTemplate = '/v3/tools/external-tools/{id}/logo';

				const baseUrl = Configuration.get('PUBLIC_BACKEND_URL') as string;
				const id = externalTool.id as string;
				const expected = `${baseUrl}/v3/tools/external-tools/${id}/logo`;

				return {
					externalTool,
					logoUrlTemplate,
					expected,
				};
			};

			it('should return an internal logoUrl', () => {
				const { externalTool, logoUrlTemplate, expected } = setup();

				const logoUrl = service.buildLogoUrl(logoUrlTemplate, externalTool);

				expect(logoUrl).toEqual(expected);
			});
		});
	});

	describe('validateLogoSize', () => {
		describe('when external tool has a given base64 logo', () => {
			describe('when size is exceeded', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.withBase64Logo().build();
					toolFeatures.maxExternalToolLogoSizeInBytes = 1;

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
					toolFeatures.maxExternalToolLogoSizeInBytes = 30000;

					return { externalTool };
				};

				it('should not throw an error', () => {
					const { externalTool } = setup();

					const func = () => service.validateLogoSize(externalTool);

					expect(func).not.toThrow();
				});
			});
		});

		describe('when external tool has a given base64 logo', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().build();
				toolFeatures.maxExternalToolLogoSizeInBytes = 30000;

				return { externalTool };
			};

			it('should not throw an error', () => {
				const { externalTool } = setup();

				const func = () => service.validateLogoSize(externalTool);

				expect(func).not.toThrow();
			});
		});
	});

	describe('fetchBase64Logo', () => {
		describe('when logoUrl is given', () => {
			const setup = () => {
				const logoUrl = 'https://example.com/logo.png';
				const logoBuffer: Buffer = Buffer.from('logo content', 'utf-8');
				const logoBase64: string = logoBuffer.toString('base64');

				httpService.get.mockReturnValue(
					of({
						data: logoBuffer,
						status: HttpStatus.OK,
						statusText: 'OK',
						headers: {},
						config: {},
					} as AxiosResponse<ArrayBuffer>)
				);

				return {
					logoUrl,
					logoBase64,
				};
			};

			it('should fetch logo', async () => {
				const { logoUrl } = setup();

				await service.fetchBase64Logo(logoUrl);

				expect(httpService.get).toHaveBeenCalledWith(logoUrl, { responseType: 'arraybuffer' });
			});

			it('should log the fetched url', async () => {
				const { logoUrl } = setup();

				await service.fetchBase64Logo(logoUrl);

				expect(logger.info).toHaveBeenCalledWith(new ExternalToolLogoFetchedLoggable(logoUrl));
			});

			it('should convert to base64', async () => {
				const { logoUrl, logoBase64 } = setup();

				const result: string | null = await service.fetchBase64Logo(logoUrl);

				expect(result).toBe(logoBase64);
			});
		});

		describe('when error occurs on fetching logo', () => {
			const setup = () => {
				const logoUrl = 'https://example.com/logo.png';

				httpService.get.mockReturnValue(
					throwError(() => new HttpException('Failed to fetch logo', HttpStatus.NOT_FOUND))
				);

				return {
					logoUrl,
				};
			};

			it('should throw error', async () => {
				const { logoUrl } = setup();

				const func = () => service.fetchBase64Logo(logoUrl);

				await expect(func()).rejects.toThrow(HttpException);
			});
		});
	});

	describe('fetchLogo', () => {
		describe('when tool has no logo url', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ logoUrl: undefined });
				const fetchBase64LogoSpy = jest.spyOn(service, 'fetchBase64Logo');

				return {
					externalTool,
					fetchBase64LogoSpy,
				};
			};

			it('should not fetch the logo', async () => {
				const { externalTool, fetchBase64LogoSpy } = setup();

				await service.fetchLogo(externalTool);

				expect(fetchBase64LogoSpy).not.toHaveBeenCalled();
			});
		});

		describe('when tool has a logo url', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const fetchBase64LogoSpy = jest.spyOn(service, 'fetchBase64Logo');
				const logoBuffer: Buffer = Buffer.from('logo content', 'utf-8');

				const base64Logo = logoBuffer.toString('base64');
				httpService.get.mockReturnValue(
					of({
						data: logoBuffer,
						status: HttpStatus.OK,
						statusText: 'OK',
						headers: {},
						config: {},
					} as AxiosResponse<ArrayBuffer>)
				);

				return {
					externalTool,
					fetchBase64LogoSpy,
					base64Logo,
				};
			};

			it('should call fetchBase64Logo the logo', async () => {
				const { externalTool, fetchBase64LogoSpy } = setup();

				await service.fetchLogo(externalTool);

				expect(fetchBase64LogoSpy).toHaveBeenCalledWith(externalTool.logoUrl);
			});

			it('should return base64 encoded logo', async () => {
				const { externalTool, base64Logo } = setup();

				const result = await service.fetchLogo(externalTool);

				expect(result).toEqual(base64Logo);
			});
		});
	});

	describe('getExternalToolBinaryLogo', () => {
		describe('when logoBase64 is available', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().buildWithId();

				externalToolService.findExternalToolById.mockResolvedValue(externalTool);

				return {
					externalToolId: externalTool.id as string,
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

		describe('when logoBase64 is not available', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				externalToolService.findExternalToolById.mockResolvedValue(externalTool);

				return {
					externalToolId: externalTool.id as string,
				};
			};

			it('should throw ExternalToolLogoNotFoundLoggableException', async () => {
				const { externalToolId } = setup();

				await expect(service.getExternalToolBinaryLogo(externalToolId)).rejects.toThrow(
					ExternalToolLogoNotFoundLoggableException
				);
			});
		});
	});
});
