import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { Action, AuthorizationService } from '@modules/authorization';
import { School, SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool/service';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject/page';
import { Role, User } from '@shared/domain/entity';
import { IFindOptions, Permission, SortOrder } from '@shared/domain/interface';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { CustomParameter } from '../../common/domain';
import { ExternalToolSearchQuery } from '../../common/interface';
import { CommonToolMetadataService } from '../../common/service/common-tool-metadata.service';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import {
	ExternalTool,
	ExternalToolDatasheetTemplateData,
	ExternalToolMetadata,
	ExternalToolParameterDatasheetTemplateProperty,
	ExternalToolProps,
	Oauth2ToolConfig,
} from '../domain';
import {
	DatasheetPdfService,
	ExternalToolLogoService,
	ExternalToolService,
	ExternalToolValidationService,
} from '../service';
import {
	customParameterFactory,
	externalToolDatasheetTemplateDataFactory,
	externalToolFactory,
	oauth2ToolConfigFactory,
} from '../testing';
import { ExternalToolUpdate } from './dto';
import { ExternalToolUc } from './external-tool.uc';

describe(ExternalToolUc.name, () => {
	let module: TestingModule;
	let uc: ExternalToolUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let schoolService: DeepMocked<SchoolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let toolValidationService: DeepMocked<ExternalToolValidationService>;
	let logoService: DeepMocked<ExternalToolLogoService>;
	let commonToolMetadataService: DeepMocked<CommonToolMetadataService>;
	let pdfService: DeepMocked<DatasheetPdfService>;

	beforeAll(async () => {
		await setupEntities();

		Configuration.set('SC_THEME', 'default');

		module = await Test.createTestingModule({
			providers: [
				ExternalToolUc,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: ExternalToolValidationService,
					useValue: createMock<ExternalToolValidationService>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
				{
					provide: CommonToolMetadataService,
					useValue: createMock<CommonToolMetadataService>(),
				},
				{
					provide: DatasheetPdfService,
					useValue: createMock<DatasheetPdfService>(),
				},
			],
		}).compile();

		uc = module.get(ExternalToolUc);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		schoolService = module.get(SchoolService);
		authorizationService = module.get(AuthorizationService);
		toolValidationService = module.get(ExternalToolValidationService);
		logoService = module.get(ExternalToolLogoService);
		commonToolMetadataService = module.get(CommonToolMetadataService);
		pdfService = module.get(DatasheetPdfService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setupAuthorization = () => {
		const user: User = userFactory.buildWithId();
		const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;

		authorizationService.getUserWithPermissions.mockResolvedValue(user);

		return {
			user,
			currentUser,
		};
	};

	const setupDefault = () => {
		const toolId = 'toolId';

		const externalTool: ExternalTool = externalToolFactory.withCustomParameters(1).buildWithId();
		const oauth2ConfigWithoutExternalData: Oauth2ToolConfig = oauth2ToolConfigFactory.build();

		const query: ExternalToolSearchQuery = {
			name: externalTool.name,
		};
		const options: IFindOptions<ExternalTool> = {
			order: {
				id: SortOrder.asc,
				name: SortOrder.asc,
			},
			pagination: {
				limit: 2,
				skip: 1,
			},
		};
		const page: Page<ExternalTool> = new Page<ExternalTool>(
			[externalToolFactory.build({ ...externalTool, config: oauth2ConfigWithoutExternalData })],
			1
		);

		externalToolService.createExternalTool.mockResolvedValueOnce(externalTool);
		externalToolService.findExternalTools.mockResolvedValueOnce(page);

		return {
			externalTool,
			oauth2ConfigWithoutExternalData,
			options,
			page,
			query,
			toolId,
		};
	};

	describe('createExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { externalTool } = setupDefault();

				await uc.createExternalTool(currentUser.userId, externalTool.getProps());

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { externalTool } = setupDefault();

				await uc.createExternalTool(currentUser.userId, externalTool.getProps());

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to create an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { externalTool } = setupDefault();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalTool> = uc.createExternalTool(currentUser.userId, externalTool);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should validate the tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setupDefault();

			await uc.createExternalTool(currentUser.userId, externalTool.getProps());

			expect(toolValidationService.validateCreate).toHaveBeenCalledWith(
				expect.objectContaining<ExternalToolProps>({
					...externalTool.getProps(),
					id: expect.any(String),
				})
			);
		});

		it('should throw if validation of the tool fails', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setupDefault();
			toolValidationService.validateCreate.mockImplementation(() => {
				throw new UnprocessableEntityException();
			});

			const result: Promise<ExternalTool> = uc.createExternalTool(currentUser.userId, externalTool.getProps());

			await expect(result).rejects.toThrow(UnprocessableEntityException);
		});

		it('should call the service to save a tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setupDefault();

			await uc.createExternalTool(currentUser.userId, externalTool.getProps());

			expect(externalToolService.createExternalTool).toHaveBeenCalledWith(
				expect.objectContaining<ExternalToolProps>({
					...externalTool.getProps(),
					id: expect.any(String),
				})
			);
		});

		it('should return saved a tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setupDefault();

			const result: ExternalTool = await uc.createExternalTool(currentUser.userId, externalTool.getProps());

			expect(result).toEqual(externalTool);
		});

		describe('when fetching logo', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return {
					currentUser,
					externalTool,
				};
			};

			it('should call ExternalToolLogoService', async () => {
				const { currentUser, externalTool } = setup();

				await uc.createExternalTool(currentUser.userId, externalTool.getProps());

				expect(logoService.fetchLogo).toHaveBeenCalledWith(
					expect.objectContaining<ExternalToolProps>({ ...externalTool.getProps(), id: expect.any(String) })
				);
			});
		});
	});

	describe('findExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { query, options } = setupDefault();

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { query, options } = setupDefault();

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to find an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { query, options } = setupDefault();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<Page<ExternalTool>> = uc.findExternalTool(currentUser.userId, query, options);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should call the externalToolService', async () => {
			const { currentUser } = setupAuthorization();
			const { query, options } = setupDefault();

			await uc.findExternalTool(currentUser.userId, query, options);

			expect(externalToolService.findExternalTools).toHaveBeenCalledWith(query, options);
		});

		it('should return a page of externalTool', async () => {
			const { currentUser } = setupAuthorization();
			const { query, options, page } = setupDefault();
			externalToolService.findExternalTools.mockResolvedValue(page);

			const resultPage: Page<ExternalTool> = await uc.findExternalTool(currentUser.userId, query, options);

			expect(resultPage).toEqual(page);
		});
	});

	describe('getExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId } = setupDefault();

				await uc.getExternalTool(currentUser.userId, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { toolId } = setupDefault();

				await uc.getExternalTool(currentUser.userId, toolId);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to get an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId } = setupDefault();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalTool> = uc.getExternalTool(currentUser.userId, toolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should fetch a tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool, toolId } = setupDefault();
			externalToolService.findById.mockResolvedValue(externalTool);

			const result: ExternalTool = await uc.getExternalTool(currentUser.userId, toolId);

			expect(result).toEqual(externalTool);
		});
	});

	describe('updateExternalTool', () => {
		const setup = () => {
			const { externalTool, toolId } = setupDefault();

			const externalToolToUpdate: ExternalToolUpdate = {
				...externalTool.getProps(),
				name: 'newName',
				url: undefined,
			};
			const updatedExternalTool: ExternalTool = externalToolFactory.build({
				...externalTool.getProps(),
				name: 'newName',
				url: undefined,
			});

			externalToolService.updateExternalTool.mockResolvedValue(updatedExternalTool);
			externalToolService.findById.mockResolvedValue(new ExternalTool(externalToolToUpdate));

			return {
				externalTool,
				updatedExternalToolDO: updatedExternalTool,
				externalToolDOtoUpdate: externalToolToUpdate,
				toolId,
			};
		};

		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate } = setup();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate } = setup();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to get an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalTool> = uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should validate the tool', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolDOtoUpdate } = setup();

			await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

			expect(toolValidationService.validateUpdate).toHaveBeenCalledWith(
				toolId,
				expect.objectContaining<ExternalToolProps>({ ...externalToolDOtoUpdate, id: expect.any(String) })
			);
		});

		it('should throw if validation of the tool fails', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolDOtoUpdate } = setup();
			toolValidationService.validateUpdate.mockImplementation(() => {
				throw new UnprocessableEntityException();
			});

			const result: Promise<ExternalTool> = uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

			await expect(result).rejects.toThrow(UnprocessableEntityException);
		});

		it('should call the service to update the tool', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolDOtoUpdate } = setup();

			await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

			expect(externalToolService.updateExternalTool).toHaveBeenCalled();
		});

		it('should return the updated tool', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolDOtoUpdate, updatedExternalToolDO } = setup();

			const result: ExternalTool = await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

			expect(result).toEqual(updatedExternalToolDO);
		});

		describe('when fetching logo', () => {
			const setupLogo = () => {
				const user: User = userFactory.buildWithId();
				const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return {
					currentUser,
					externalTool,
				};
			};

			it('should call ExternalToolLogoService', async () => {
				const { currentUser, externalTool } = setupLogo();

				await uc.createExternalTool(currentUser.userId, externalTool.getProps());

				expect(logoService.fetchLogo).toHaveBeenCalledWith(
					expect.objectContaining<ExternalToolProps>({ ...externalTool.getProps(), id: expect.any(String) })
				);
			});
		});
	});

	describe('deleteExternalTool', () => {
		const setup = () => {
			const toolId = 'toolId';
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const user: User = userFactory.buildWithId();

			authorizationService.getUserWithPermissions.mockResolvedValue(user);

			return {
				toolId,
				currentUser,
				user,
			};
		};

		it('should check that the user has TOOL_ADMIN permission', async () => {
			const { toolId, currentUser, user } = setup();

			await uc.deleteExternalTool(currentUser.userId, toolId);

			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
		});

		it('should call the externalToolService', async () => {
			const { toolId, currentUser } = setup();

			await uc.deleteExternalTool(currentUser.userId, toolId);

			expect(externalToolService.deleteExternalTool).toHaveBeenCalledWith(toolId);
		});
	});

	describe('getMetadataForExternalTool', () => {
		describe('when authorize user', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const tool: ExternalTool = externalToolFactory.buildWithId({ id: toolId }, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;
				const context = { action: Action.read, requiredPermissions: [Permission.TOOL_ADMIN] };

				externalToolService.findById.mockResolvedValue(tool);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return {
					user,
					currentUser,
					toolId,
					tool,
					context,
				};
			};

			it('get user with permissions', async () => {
				const { toolId, user } = setup();

				await uc.getMetadataForExternalTool(user.id, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should check that the user has TOOL_ADMIN permission', async () => {
				const { user, tool } = setup();

				await uc.getMetadataForExternalTool(user.id, tool.id);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});
		});

		describe('when user has insufficient permission to get an metadata for external tool ', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();

				const user: User = userFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockRejectedValue(new UnauthorizedException());

				return {
					user,
					toolId,
				};
			};

			it('should throw UnauthorizedException ', async () => {
				const { toolId, user } = setup();

				const result: Promise<ExternalToolMetadata> = uc.getMetadataForExternalTool(user.id, toolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when externalToolId is given', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();

				const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
					schoolExternalToolCount: 2,
					contextExternalToolCountPerContext: { course: 3, boardElement: 3, mediaBoard: 2 },
				});

				commonToolMetadataService.getMetadataForExternalTool.mockResolvedValue(externalToolMetadata);

				const user: User = userFactory.buildWithId();
				const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;

				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return {
					user,
					currentUser,
					toolId,
					externalToolMetadata,
				};
			};

			it('get metadata for external tool', async () => {
				const { toolId, currentUser } = setup();

				await uc.getMetadataForExternalTool(currentUser.userId, toolId);

				expect(commonToolMetadataService.getMetadataForExternalTool).toHaveBeenCalledWith(toolId);
			});

			it('return metadata of external tool', async () => {
				const { toolId, currentUser, externalToolMetadata } = setup();

				const result = await uc.getMetadataForExternalTool(currentUser.userId, toolId);

				expect(result).toEqual(externalToolMetadata);
			});
		});
	});

	describe('getDatasheet', () => {
		describe('when user has insufficient permission to create a datasheet for an external tool ', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();

				const user: User = userFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockRejectedValue(new UnauthorizedException());

				return {
					user,
					toolId,
				};
			};

			it('should throw UnauthorizedException ', async () => {
				const { toolId, user } = setup();

				const result = uc.getDatasheet(user.id, toolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when externalToolId is given', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const user: User = userFactory.buildWithId();
				const school: School = schoolFactory.build();

				const param: CustomParameter = customParameterFactory.build();
				const externalTool: ExternalTool = externalToolFactory.build({ parameters: [param] });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const datasheetData: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory
					.withParameters(1, { name: param.name, properties: ExternalToolParameterDatasheetTemplateProperty.MANDATORY })
					.build({
						toolName: externalTool.name,
						instance: 'dBildungscloud',
						creatorName: `${user.firstName} ${user.lastName}`,
						schoolName: school.getInfo().name,
					});

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.hasAllPermissions.mockReturnValue(true);
				externalToolService.findById.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([schoolExternalTool]);
				schoolService.getSchoolById.mockResolvedValue(school);
				pdfService.generatePdf.mockResolvedValue(Buffer.from('mockData'));

				return {
					user,
					toolId,
					datasheetData,
					schoolExternalTool,
				};
			};

			it('should get user with permission', async () => {
				const { user, toolId } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should check that the user has TOOL_ADMIN ot SCHOOL_TOOL_ADMIN permission', async () => {
				const { user, toolId } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(authorizationService.checkOneOfPermissions).toHaveBeenCalledWith(user, [
					Permission.TOOL_ADMIN,
					Permission.SCHOOL_TOOL_ADMIN,
				]);
			});

			it('should get external tool', async () => {
				const { toolId, user } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(externalToolService.findById).toHaveBeenCalledWith(toolId);
			});

			it('should get school external tool', async () => {
				const { toolId, user } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
					schoolId: user.school.id,
					toolId,
				});
			});

			it('should get school', async () => {
				const { toolId, user, schoolExternalTool } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(schoolExternalTool.schoolId);
			});

			it('should create pdf buffer', async () => {
				const { toolId, user, datasheetData } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(pdfService.generatePdf).toHaveBeenCalledWith(datasheetData);
			});

			it('should return buffer', async () => {
				const { toolId, user } = setup();

				const result = await uc.getDatasheet(user.id, toolId);

				expect(result).toEqual(expect.any(Buffer));
			});
		});

		describe('when there are no schoolExternalTools', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const user: User = userFactory.buildWithId();

				const externalTool: ExternalTool = externalToolFactory.build();
				const datasheetData: ExternalToolDatasheetTemplateData = externalToolDatasheetTemplateDataFactory.build({
					toolName: externalTool.name,
					instance: 'dBildungscloud',
					creatorName: `${user.firstName} ${user.lastName}`,
				});

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				externalToolService.findById.mockResolvedValue(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);
				pdfService.generatePdf.mockResolvedValueOnce(Buffer.from('mockData'));

				return {
					user,
					toolId,
					datasheetData,
				};
			};

			it('should create pdf buffer', async () => {
				const { toolId, user, datasheetData } = setup();

				await uc.getDatasheet(user.id, toolId);

				expect(pdfService.generatePdf).toHaveBeenCalledWith(datasheetData);
			});
		});
	});

	describe('createDatasheetFilename', () => {
		describe('when externalToolId is given', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.withCustomParameters(1).build();

				const date = new Date();
				jest.setSystemTime(date);
				const year = date.getFullYear();
				const month = date.getMonth() + 1;
				const day = date.getDate();
				const dateString = `${year}-${month}-${day}`;

				const filename = `CTL-Datenblatt-${externalTool.name}-${dateString}.pdf`;

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					toolId,
					filename,
				};
			};

			it('should get datasheetData', async () => {
				const { toolId } = setup();

				await uc.createDatasheetFilename(toolId);

				expect(externalToolService.findById).toHaveBeenCalledWith(toolId);
			});

			it('should create a filename', async () => {
				const { toolId, filename } = setup();

				const result = await uc.createDatasheetFilename(toolId);

				expect(result).toEqual(filename);
			});
		});
	});
});
