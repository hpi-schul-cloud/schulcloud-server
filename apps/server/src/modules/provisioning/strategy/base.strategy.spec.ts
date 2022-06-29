import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { IProviderResponse } from '@src/modules/provisioning/interface/provider.response.interface';
import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { UserUc } from '@src/modules/user/uc';

const mapper: DeepMocked<IProviderResponseMapper<IProviderResponse>> =
	createMock<IProviderResponseMapper<IProviderResponse>>();

const schoolUc: DeepMocked<SchoolUc> = createMock<SchoolUc>();

const userUc: DeepMocked<UserUc> = createMock<UserUc>();

const iProviderResponse: IProviderResponse = {};

class MockStrategy extends ProvisioningStrategy<IProviderResponse> {
	constructor() {
		super(mapper, schoolUc, userUc);
	}

	override getProvisioningData(): Promise<IProviderResponse> {
		return Promise.resolve(iProviderResponse);
	}
}

describe('BaseStrategy', () => {
	let baseStrategy: MockStrategy;

	beforeEach(() => {
		baseStrategy = new MockStrategy();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('apply', () => {
		const schoolDto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({ id: 'id', name: 'schoolName' });
		const userDto: ProvisioningUserOutputDto = new ProvisioningUserOutputDto({
			email: 'mail',
			firstName: 'firstName',
			lastName: 'lastame',
			roleNames: [],
			schoolId: 'schoolId',
		});
		schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDto);

		it('should apply strategy', async () => {
			// Arrange
			mapper.mapToSchoolDto.mockReturnValue(schoolDto);
			mapper.mapToUserDto.mockReturnValue(userDto);

			// Act
			const result = await baseStrategy.apply();

			// Assert
			expect(mapper.mapToSchoolDto).toHaveBeenCalledWith(iProviderResponse);
			expect(schoolUc.saveProvisioningSchoolOutputDto).toHaveBeenCalledWith(schoolDto);
			expect(mapper.mapToUserDto).toHaveBeenCalledWith(iProviderResponse, schoolDto.id);
			expect(userUc.saveProvisioningUserOutputDto).toHaveBeenCalled();
			expect(result.userDto).toEqual(userDto);
			expect(result.schoolDto).toEqual(schoolDto);
		});

		it('should not save school', async () => {
			// Arrange
			mapper.mapToSchoolDto.mockReturnValue(undefined);
			mapper.mapToUserDto.mockReturnValue(userDto);

			// Act
			const result = await baseStrategy.apply();

			// Assert
			expect(mapper.mapToSchoolDto).toHaveBeenCalledWith(iProviderResponse);
			expect(schoolUc.saveProvisioningSchoolOutputDto).not.toHaveBeenCalled();
			expect(mapper.mapToUserDto).not.toHaveBeenCalledWith(iProviderResponse, schoolDto.id);
			expect(userUc.saveProvisioningUserOutputDto).toHaveBeenCalled();
			expect(result.userDto).toEqual(userDto);
			expect(result.schoolDto).toEqual(undefined);
		});
	});
});
