import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities, userFactory } from '@shared/testing';
import { ICurrentUser, Permission, User } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { UnauthorizedException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { ConfigurationScope } from '../interface';
import { AuthorizationService } from '../../authorization';
import { ExternalToolService } from '../service/external-tool.service';
import { ExternalToolConfigurationUc } from './external-tool-configuration.uc';

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

	const setupAuthorization = () => {
		const user: User = userFactory.buildWithId();
		const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;

		authorizationService.getUserWithPermissions.mockResolvedValue(user);

		return {
			user,
			currentUser,
		};
	};

	describe('getExternalToolForScope is called', () => {
		const setupForScope = () => {
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const externalToolId: string = new ObjectId().toHexString();
			const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId(undefined, externalToolId);
			const scope: ConfigurationScope = ConfigurationScope.SCHOOL;

			externalToolService.getExternalToolForScope.mockResolvedValue(externalToolDO);

			return {
				currentUser,
				externalToolDO,
				externalToolId,
				scope,
			};
		};

		describe('when the user has permission to read an external tool', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { externalToolId, scope } = setupForScope();

				await uc.getExternalToolForScope(currentUser.userId, externalToolId, scope);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { externalToolId, scope } = setupForScope();

				await uc.getExternalToolForScope(currentUser.userId, externalToolId, scope);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.SCHOOL_TOOL_ADMIN]);
			});

			it('should call the externalToolService', async () => {
				const { externalToolId, currentUser, scope } = setupForScope();

				await uc.getExternalToolForScope(currentUser.userId, externalToolId, scope);

				expect(externalToolService.getExternalToolForScope).toHaveBeenCalledWith(
					externalToolId,
					ConfigurationScope.SCHOOL
				);
			});
		});
		describe('when the user has insufficient permission to read an external tool', () => {
			it('should throw UnauthorizedException ', async () => {
				const { currentUser } = setupAuthorization();
				const { externalToolId, scope } = setupForScope();

				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalToolDO> = uc.getExternalToolForScope(currentUser.userId, externalToolId, scope);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when tool is hidden', () => {
			it(' should throw NotFoundException', async () => {
				const { externalToolId, currentUser, scope, externalToolDO } = setupForScope();
				externalToolDO.isHidden = true;

				const result = uc.getExternalToolForScope(currentUser.userId, externalToolId, scope);

				await expect(result).rejects.toThrow(new NotFoundException('Could not find the Tool Template'));
			});
		});
	});
});
