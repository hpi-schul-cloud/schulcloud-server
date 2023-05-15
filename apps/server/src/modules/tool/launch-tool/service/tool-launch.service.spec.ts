import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolDO } from '@shared/domain/domainobject/tool/context-external-tool.do';
import { InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import {
	basicToolConfigDOFactory,
	contextExternalToolDOFactory,
	externalToolDOFactory,
	lti11ToolConfigDOFactory,
	oauth2ToolConfigDOFactory,
	schoolExternalToolDOFactory,
} from '@shared/testing';
import {
	BasicToolConfigDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
	SchoolExternalToolDO,
	ToolConfigType,
} from '@shared/domain';
import { ToolLaunchDataDO } from '@shared/domain/domainobject/tool/launch';
import { toolLaunchDataFactory } from '@shared/testing/factory/domainobject/tool/tool-launch-data.factory';
import { ToolLaunchService } from './tool-launch.service';
import { ExternalToolService, SchoolExternalToolService } from '../../service';
import { BasicToolLaunchStrategy, IToolLaunchParams } from '../strategy';

describe('ToolLaunchService', () => {
	let module: TestingModule;
	let service: ToolLaunchService;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let basicToolLaunchStrategy: DeepMocked<BasicToolLaunchStrategy>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolLaunchService,
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: BasicToolLaunchStrategy,
					useValue: createMock<BasicToolLaunchStrategy>(),
				},
			],
		}).compile();

		service = module.get<ToolLaunchService>(ToolLaunchService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		externalToolService = module.get(ExternalToolService);
		basicToolLaunchStrategy = module.get(BasicToolLaunchStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getLaunchData', () => {
		describe('when the tool config type is BASIC', () => {
			const setup = () => {
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId();
				const contextExternalToolDO: ContextExternalToolDO = contextExternalToolDOFactory.build({
					schoolToolId: schoolExternalToolDO.id,
				});
				const basicToolConfigDO: BasicToolConfigDO = basicToolConfigDOFactory.build();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({
					config: basicToolConfigDO,
				});

				const launchDataDO: ToolLaunchDataDO = toolLaunchDataFactory.build();

				const launchParams: IToolLaunchParams = {
					externalToolDO,
					schoolExternalToolDO,
					config: basicToolConfigDO,
					contextExternalToolDO,
				};

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(schoolExternalToolDO);
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);
				basicToolLaunchStrategy.createLaunchData.mockReturnValue(launchDataDO);

				return {
					launchDataDO,
					launchParams,
				};
			};

			it('should return launchData', async () => {
				const { launchParams, launchDataDO } = setup();

				const result: ToolLaunchDataDO = await service.getLaunchData(launchParams.contextExternalToolDO);

				expect(result).toEqual(launchDataDO);
			});

			it('should call basicToolLaunchStrategy with given launchParams ', async () => {
				const { launchParams } = setup();

				await service.getLaunchData(launchParams.contextExternalToolDO);

				expect(basicToolLaunchStrategy.createLaunchData).toHaveBeenCalledWith(launchParams);
			});

			it('should call getSchoolExternalToolById', async () => {
				const { launchParams } = setup();

				await service.getLaunchData(launchParams.contextExternalToolDO);

				expect(schoolExternalToolService.getSchoolExternalToolById).toHaveBeenCalledWith(
					launchParams.schoolExternalToolDO.id
				);
			});

			it('should call findExternalToolById', async () => {
				const { launchParams } = setup();

				await service.getLaunchData(launchParams.contextExternalToolDO);

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(launchParams.schoolExternalToolDO.toolId);
			});
		});

		describe('when the tool config type is LTI11', () => {
			const setup = () => {
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId();
				const contextExternalToolDO: ContextExternalToolDO = contextExternalToolDOFactory.build({
					schoolToolId: schoolExternalToolDO.id,
				});
				const lti11ToolConfigDO: Lti11ToolConfigDO = lti11ToolConfigDOFactory.build();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({
					config: lti11ToolConfigDO,
				});

				const launchDataDO: ToolLaunchDataDO = toolLaunchDataFactory.build();

				const launchParams: IToolLaunchParams = {
					externalToolDO,
					schoolExternalToolDO,
					config: lti11ToolConfigDO,
					contextExternalToolDO,
				};

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(schoolExternalToolDO);
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

				return {
					launchDataDO,
					launchParams,
				};
			};

			it('should throw NotImplementedException for LTI11 tool config', async () => {
				const { launchParams } = setup();

				const func = () => service.getLaunchData(launchParams.contextExternalToolDO);

				await expect(func()).rejects.toThrow(new NotImplementedException('LTI 1.1 launch is not implemented yet'));
			});

			it('should call getSchoolExternalToolById', async () => {
				const { launchParams } = setup();

				try {
					await service.getLaunchData(launchParams.contextExternalToolDO);
				} catch (exception) {
					/* Do nothing */
				}

				expect(schoolExternalToolService.getSchoolExternalToolById).toHaveBeenCalledWith(
					launchParams.schoolExternalToolDO.id
				);
			});

			it('should call findExternalToolById', async () => {
				const { launchParams } = setup();

				try {
					await service.getLaunchData(launchParams.contextExternalToolDO);
				} catch (exception) {
					/* Do nothing */
				}

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(launchParams.schoolExternalToolDO.toolId);
			});
		});

		describe('when the tool config type is Oauth2', () => {
			const setup = () => {
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId();
				const contextExternalToolDO: ContextExternalToolDO = contextExternalToolDOFactory.build({
					schoolToolId: schoolExternalToolDO.id,
				});
				const oauth2ToolConfigDO: Oauth2ToolConfigDO = oauth2ToolConfigDOFactory.build();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({
					config: oauth2ToolConfigDO,
				});

				const launchDataDO: ToolLaunchDataDO = toolLaunchDataFactory.build();

				const launchParams: IToolLaunchParams = {
					externalToolDO,
					schoolExternalToolDO,
					config: oauth2ToolConfigDO,
					contextExternalToolDO,
				};

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(schoolExternalToolDO);
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

				return {
					launchDataDO,
					launchParams,
				};
			};

			it('should throw NotImplementedException for Oauth2 tool config', async () => {
				const { launchParams } = setup();

				const func = () => service.getLaunchData(launchParams.contextExternalToolDO);

				await expect(func()).rejects.toThrow(new NotImplementedException('OAuth2 launch is not implemented yet'));
			});

			it('should call getSchoolExternalToolById', async () => {
				const { launchParams } = setup();

				try {
					await service.getLaunchData(launchParams.contextExternalToolDO);
				} catch (exception) {
					/* Do nothing */
				}

				expect(schoolExternalToolService.getSchoolExternalToolById).toHaveBeenCalledWith(
					launchParams.schoolExternalToolDO.id
				);
			});

			it('should call findExternalToolById', async () => {
				const { launchParams } = setup();

				try {
					await service.getLaunchData(launchParams.contextExternalToolDO);
				} catch (exception) {
					/* Do nothing */
				}

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(launchParams.schoolExternalToolDO.toolId);
			});
		});

		describe('when the tool config type is unknown', () => {
			const setup = () => {
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId();
				const contextExternalToolDO: ContextExternalToolDO = contextExternalToolDOFactory.build({
					schoolToolId: schoolExternalToolDO.id,
				});
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build();
				externalToolDO.config.type = 'unknown' as ToolConfigType;

				const launchParams: IToolLaunchParams = {
					externalToolDO,
					schoolExternalToolDO,
					config: externalToolDO.config,
					contextExternalToolDO,
				};

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(schoolExternalToolDO);
				externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

				return {
					launchParams,
				};
			};

			it('should throw InternalServerErrorException for unknown tool config type', async () => {
				const { launchParams } = setup();

				await expect(service.getLaunchData(launchParams.contextExternalToolDO)).rejects.toThrow(
					new InternalServerErrorException('Unknown tool config type')
				);
			});

			it('should call getSchoolExternalToolById', async () => {
				const { launchParams } = setup();

				try {
					await service.getLaunchData(launchParams.contextExternalToolDO);
				} catch (exception) {
					// Do nothing
				}

				expect(schoolExternalToolService.getSchoolExternalToolById).toHaveBeenCalledWith(
					launchParams.schoolExternalToolDO.id
				);
			});

			it('should call findExternalToolById', async () => {
				const { launchParams } = setup();

				try {
					await service.getLaunchData(launchParams.contextExternalToolDO);
				} catch (exception) {
					// Do nothing
				}

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(launchParams.schoolExternalToolDO.toolId);
			});
		});
	});
});
