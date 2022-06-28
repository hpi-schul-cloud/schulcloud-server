import { Test, TestingModule } from '@nestjs/testing';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ProvisioningUc } from '@src/modules/provisioning/uc/provisioning.uc';
import { UserUc } from '@src/modules/user/uc';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { UnknownProvisioningStrategy } from '@src/modules/provisioning/strategy/unknown/unknown.strategy';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { ProvisioningException } from '@src/modules/provisioning/exception/provisioning.exception';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { Permission, RoleName } from '@shared/domain';
import { Logger } from '@src/core/logger';

describe('ProvisioningUc', () => {
	let module: TestingModule;
	let provisioningUc: ProvisioningUc;

	let userUc: DeepMocked<UserUc>;
	let schoolUc: DeepMocked<SchoolUc>;
	let systemUc: DeepMocked<SystemUc>;
	let unknownStrategy: DeepMocked<UnknownProvisioningStrategy>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ProvisioningUc,
				{
					provide: UserUc,
					useValue: createMock<UserUc>(),
				},
				{
					provide: RoleUc,
					useValue: createMock<RoleUc>(),
				},
				{
					provide: SchoolUc,
					useValue: createMock<SchoolUc>(),
				},
				{
					provide: SystemUc,
					useValue: createMock<SystemUc>(),
				},
				{
					provide: UnknownProvisioningStrategy,
					useValue: createMock<UnknownProvisioningStrategy>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		provisioningUc = module.get(ProvisioningUc);

		userUc = module.get(UserUc);
		schoolUc = module.get(SchoolUc);
		systemUc = module.get(SystemUc);
		unknownStrategy = module.get(UnknownProvisioningStrategy);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('process', () => {
		const unknownSystemStrategyId = 'unknownSystemId';
		const unknownStrategySystem: SystemDto = new SystemDto({
			type: 'unknown',
			provisioningStrategy: SystemProvisioningStrategy.UNKNOWN,
		});
		let schoolDto: SchoolDto;
		let roleDto: RoleDto;
		let userDto: UserDto;

		beforeEach(() => {
			systemUc.findById.mockImplementationOnce((id: string): Promise<SystemDto> => {
				if (id === unknownSystemStrategyId) {
					return Promise.resolve(unknownStrategySystem);
				}
				return Promise.reject();
			});

			schoolDto = new SchoolDto({ name: 'schoolName' });
			roleDto = new RoleDto({
				name: RoleName.DEMO,
				permissions: [Permission.ADMIN_EDIT],
			});
			userDto = new UserDto({
				id: 'userId',
				email: 'userEmail',
				firstName: 'userFirstname',
				lastName: 'userLastname',
				roles: [roleDto],
				school: schoolDto,
			});
		});

		it('should throw error when system does not exists', async () => {
			// Act & Assert
			await expect(provisioningUc.process('sub', 'no system found')).rejects.toThrow(ProvisioningException);
		});

		it('should apply "unknown" provisioning strategy', async () => {
			// Arrange
			unknownStrategy.apply.mockResolvedValueOnce(
				new ProvisioningDto({
					userDto: new UserDto(userDto),
					schoolDto: new SchoolDto(schoolDto),
				})
			);

			// Act
			await provisioningUc.process('sub', unknownSystemStrategyId);

			// Assert
			expect(unknownStrategy.apply).toHaveBeenCalled();
			expect(schoolUc.save).toHaveBeenCalledWith(schoolDto);
			expect(userUc.save).toHaveBeenCalledWith(userDto);
		});

		it('should throw error for missing provisioning stratgey', async () => {
			// Arrange
			const missingStrategySystem: SystemDto = new SystemDto({
				type: 'unknown',
				provisioningStrategy: 'unknown strategy' as SystemProvisioningStrategy,
			});
			systemUc.findById.mockReset();
			systemUc.findById.mockResolvedValueOnce(missingStrategySystem);

			// Act & Assert
			await expect(provisioningUc.process('sub', 'missingStrategySystemId')).rejects.toThrow(ProvisioningException);
			expect(logger.error).toHaveBeenCalled();
		});

		it('should not save schoolDto', async () => {
			// Arrange
			unknownStrategy.apply.mockResolvedValueOnce(
				new ProvisioningDto({
					userDto: new UserDto(userDto),
				})
			);

			// Act
			await provisioningUc.process('sub', unknownSystemStrategyId);

			// Assert
			expect(unknownStrategy.apply).toHaveBeenCalled();
			expect(userUc.save).toHaveBeenCalledWith(userDto);
			expect(schoolUc.save).not.toHaveBeenCalled();
		});

		it('should not save userDto', async () => {
			// Arrange
			unknownStrategy.apply.mockResolvedValueOnce(
				new ProvisioningDto({
					schoolDto: new SchoolDto(schoolDto),
				})
			);

			// Act
			await provisioningUc.process('sub', unknownSystemStrategyId);

			// Assert
			expect(unknownStrategy.apply).toHaveBeenCalled();
			expect(schoolUc.save).toHaveBeenCalledWith(schoolDto);
			expect(userUc.save).not.toHaveBeenCalled();
		});
	});
});
