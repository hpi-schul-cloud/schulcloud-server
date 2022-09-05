import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { UserService } from '@src/modules/user/service/user.service';

class MockResponse {}

const mapper: DeepMocked<IProviderResponseMapper<MockResponse>> = createMock<IProviderResponseMapper<MockResponse>>();

const schoolUc: DeepMocked<SchoolUc> = createMock<SchoolUc>();

const userService: DeepMocked<UserService> = createMock<UserService>();

const mockResponse: MockResponse = {};

class MockStrategy extends ProvisioningStrategy<MockResponse> {
	constructor() {
		super(mapper, schoolUc, userService);
	}

	override getProvisioningData(): Promise<MockResponse> {
		return Promise.resolve(mockResponse);
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.UNDEFINED;
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
			expect(mapper.mapToSchoolDto).toHaveBeenCalledWith(mockResponse);
			expect(schoolUc.saveProvisioningSchoolOutputDto).toHaveBeenCalledWith(schoolDto);
			expect(mapper.mapToUserDto).toHaveBeenCalledWith(mockResponse, schoolDto.id);
			expect(userService.saveProvisioningUserOutputDto).toHaveBeenCalled();
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
			expect(mapper.mapToSchoolDto).toHaveBeenCalledWith(mockResponse);
			expect(schoolUc.saveProvisioningSchoolOutputDto).not.toHaveBeenCalled();
			expect(mapper.mapToUserDto).not.toHaveBeenCalledWith(mockResponse, schoolDto.id);
			expect(userService.saveProvisioningUserOutputDto).toHaveBeenCalled();
			expect(result.userDto).toEqual(userDto);
			expect(result.schoolDto).toEqual(undefined);
		});
	});
});
