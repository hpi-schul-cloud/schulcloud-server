import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities, userFactory } from '@shared/testing';
import { Actions, ICurrentUser, Permission, User } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { ForbiddenException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { ConfigurationScope } from '../interface';
import { AuthorizationService } from '../../authorization';
import { ExternalToolService } from '../service/external-tool.service';
import { ExternalToolConfigurationUc } from './external-tool-configuration.uc';
import { AllowedAuthorizationEntityType } from '../../authorization/interfaces';

describe('ExternalToolConfigurationUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: ExternalToolConfigurationUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		orm = await setupEntities();

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
			],
		}).compile();

		uc = module.get(ExternalToolConfigurationUc);
		externalToolService = module.get(ExternalToolService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
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
						action: Actions.read,
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
});
