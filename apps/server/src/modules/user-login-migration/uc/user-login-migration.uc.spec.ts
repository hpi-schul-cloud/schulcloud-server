import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { UserMigrationService } from '@src/modules/user-login-migration/service/user-migration.service';
import { PageTypes } from '../interface/page-types.enum';
import { UserLoginMigrationService } from '../service';
import { PageContentDto } from '../service/dto/page-content.dto';
import { UserLoginMigrationUc } from './user-login-migration.uc';

describe('UserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: UserLoginMigrationUc;

	let userMigrationService: DeepMocked<UserMigrationService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationUc,
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
			],
		}).compile();

		uc = module.get(UserLoginMigrationUc);
		userMigrationService = module.get(UserMigrationService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getPageContent is called', () => {
		describe('when it should get page-content', () => {
			const setup = () => {
				const dto: PageContentDto = {
					proceedButtonUrl: 'proceed',
					cancelButtonUrl: 'cancel',
				};

				userMigrationService.getPageContent.mockResolvedValue(dto);

				return { dto };
			};

			it('should return a response', async () => {
				const { dto } = setup();

				const testResp: PageContentDto = await uc.getPageContent(
					PageTypes.START_FROM_TARGET_SYSTEM,
					'source',
					'target'
				);

				expect(testResp.proceedButtonUrl).toEqual(dto.proceedButtonUrl);
				expect(testResp.cancelButtonUrl).toEqual(dto.cancelButtonUrl);
			});
		});
	});

	describe('getMigrations', () => {
		describe('when searching for a users migration', () => {
			const setup = () => {
				const userId = 'userId';

				const migrations: Page<UserLoginMigrationDO> = new Page<UserLoginMigrationDO>([], 0);

				userLoginMigrationService.findUserLoginMigrations.mockResolvedValue(migrations);

				return { userId, migrations };
			};

			it('should return a response', async () => {
				const { userId, migrations } = setup();

				const result: Page<UserLoginMigrationDO> = await uc.getMigrations(userId, { userId }, {});

				expect(result).toEqual(migrations);
			});
		});

		describe('when searching for other users migrations', () => {
			const setup = () => {
				const userId = 'userId';

				return { userId };
			};

			it('should return a response', async () => {
				const { userId } = setup();

				const func = async () => uc.getMigrations(userId, { userId: 'otherUserId' }, {});

				await expect(func).rejects.toThrow(
					new ForbiddenException('Accessing migration status of another user is forbidden.')
				);
			});
		});
	});
});
