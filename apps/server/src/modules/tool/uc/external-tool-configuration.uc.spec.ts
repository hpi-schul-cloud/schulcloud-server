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
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { ConfigurationScope } from '../interface';
import { AuthorizationService } from '../../authorization';
import { ExternalToolService } from '../service/external-tool.service';
import { ExternalToolConfigurationUc } from './external-tool-configuration.uc';
import { SchoolService } from '../../school';

describe('ExternalToolConfigurationUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: ExternalToolConfigurationUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<SchoolService>;

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
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		uc = module.get(ExternalToolConfigurationUc);
		externalToolService = module.get(ExternalToolService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(SchoolService);
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
			const school: SchoolDO = new SchoolDO({
				id: user.school.id,
				name: user.school.name,
			});

			authorizationService.getUserWithPermissions.mockResolvedValue(user);
			schoolService.getSchoolById.mockResolvedValue(school);

			return {
				user,
				currentUser,
				school,
			};
		};
		const setupForSchool = () => {
			// const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const externalToolId: string = new ObjectId().toHexString();
			const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId(undefined, externalToolId);
			const scope: ConfigurationScope = ConfigurationScope.SCHOOL;

			externalToolService.getExternalToolForScope.mockResolvedValue(externalToolDO);

			return {
				// currentUser,
				externalToolDO,
				externalToolId,
				scope,
			};
		};

		describe('when the user has permission to read an external tool', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { externalToolId } = setupForSchool();

				await uc.getExternalToolForSchool(currentUser.userId, externalToolId, 'schoolId');

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user, school } = setupAuthorization();
				const { externalToolId } = setupForSchool();

				await uc.getExternalToolForSchool(currentUser.userId, externalToolId, 'schoolId');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, school, {
					action: Actions.read,
					requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
				});
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

				authorizationService.checkPermission.mockImplementation(() => {
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
