import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, User } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { Page } from '@shared/domain/domainobject/page';
import { setupEntities, userFactory } from '@shared/testing';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { ICurrentUser } from '@src/modules/authentication';
import { Action, AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules/authorization';
import { ConfigurationScope } from '../interface';
import { ExternalToolService, SchoolExternalToolService } from '../service';
import { ExternalToolConfigurationUc } from './external-tool-configuration.uc';

describe('ExternalToolConfigurationUc', () => {
	let module: TestingModule;
	let uc: ExternalToolConfigurationUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				ExternalToolConfigurationUc,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
			],
		}).compile();

		uc = module.get(ExternalToolConfigurationUc);
		externalToolService = module.get(ExternalToolService);
		authorizationService = module.get(AuthorizationService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getExternalToolForScope is called', () => {
		const setupAuthorization = () => {
			const user: User = userFactory.buildWithId();
			const currentUser: ICurrentUser = { userId: user.id, schoolId: user.school.id } as ICurrentUser;

			return {
				user,
				currentUser,
			};
		};
		const setupForSchool = () => {
			const externalToolId: string = new ObjectId().toHexString();
			const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId(undefined, externalToolId);
			const scope: ConfigurationScope = ConfigurationScope.SCHOOL;

			externalToolService.getExternalToolForScope.mockResolvedValue(externalToolDO);

			return {
				externalToolDO,
				externalToolId,
				scope,
			};
		};

		describe('when the user has permission to read an external tool', () => {
			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { externalToolId } = setupForSchool();

				await uc.getExternalToolForSchool(currentUser.userId, externalToolId, 'schoolId');

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.School,
					'schoolId',
					{
						action: Action.read,
						requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
					}
				);
			});

			it('should call the externalToolService', async () => {
				const { currentUser } = setupAuthorization();
				const { externalToolId } = setupForSchool();

				await uc.getExternalToolForSchool(currentUser.userId, externalToolId, 'schoolId');

				expect(externalToolService.getExternalToolForScope).toHaveBeenCalledWith(
					externalToolId,
					ConfigurationScope.SCHOOL
				);
			});
		});

		describe('when the user has insufficient permission to read an external tool', () => {
			it('should throw UnauthorizedException ', async () => {
				const { currentUser } = setupAuthorization();
				const { externalToolId } = setupForSchool();

				authorizationService.checkPermissionByReferences.mockImplementation(() => {
					throw new ForbiddenException();
				});

				const result: Promise<ExternalToolDO> = uc.getExternalToolForSchool(
					currentUser.userId,
					externalToolId,
					'wrongSchoolId'
				);

				await expect(result).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when tool is hidden', () => {
			it(' should throw NotFoundException', async () => {
				const { currentUser } = setupAuthorization();
				const { externalToolId, externalToolDO } = setupForSchool();
				externalToolDO.isHidden = true;

				const result = uc.getExternalToolForSchool(currentUser.userId, externalToolId, 'schoolId');

				await expect(result).rejects.toThrow(new NotFoundException('Could not find the Tool Template'));
			});
		});
	});

	describe('getAvailableToolsForSchool is called', () => {
		describe('when checking for the users permission', () => {
			const setupAuthorization = () => {
				const user: User = userFactory.buildWithId();
				const schoolId = 'schoolId';

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>([], 0));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

				return {
					user,
					schoolId,
				};
			};

			it('should call the authorizationService with SCHOOL_TOOL_ADMIN permission', async () => {
				const { user, schoolId } = setupAuthorization();

				await uc.getAvailableToolsForSchool(user.id, 'schoolId');

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.School,
					schoolId,
					{
						action: Action.read,
						requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
					}
				);
			});

			it('should fail when authorizationService throws ForbiddenException', async () => {
				setupAuthorization();

				authorizationService.checkPermissionByReferences.mockImplementation(() => {
					throw new ForbiddenException();
				});

				const func = uc.getAvailableToolsForSchool('userId', 'schoolId');

				await expect(func).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when getting the list of external tools that can be added to a school', () => {
			it('should filter tools that are already in use', async () => {
				const externalToolDOs: ExternalToolDO[] = [
					externalToolDOFactory.buildWithId(undefined, 'usedToolId'),
					externalToolDOFactory.buildWithId(undefined, 'unusedToolId'),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue(
					schoolExternalToolDOFactory.buildList(1, { toolId: 'usedToolId' })
				);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toHaveLength(1);
			});

			it('should filter tools that are hidden', async () => {
				const externalToolDOs: ExternalToolDO[] = [
					externalToolDOFactory.buildWithId({ isHidden: true }),
					externalToolDOFactory.buildWithId({ isHidden: false }),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toHaveLength(1);
			});

			it('should return a list of available external tools', async () => {
				const externalToolDOs: ExternalToolDO[] = externalToolDOFactory.buildListWithId(2);

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toEqual(externalToolDOs);
			});
		});
	});
});
