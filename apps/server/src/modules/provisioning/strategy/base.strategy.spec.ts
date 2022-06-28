import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { IProviderResponse } from '@src/modules/provisioning/interface/provider.response.interface';
import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';

const mapper: DeepMocked<IProviderResponseMapper<IProviderResponse>> =
	createMock<IProviderResponseMapper<IProviderResponse>>();

class MockStrategy extends ProvisioningStrategy<IProviderResponse> {
	constructor() {
		super(mapper);
	}

	override getProvisioningData(): Promise<IProviderResponse> {
		return Promise.resolve({});
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

	it('apply', async () => {
		// Arrange
		const provisioningDto = new ProvisioningDto({});
		mapper.mapToDto.mockReturnValue(provisioningDto);

		// Act
		const result = await baseStrategy.apply();

		// Assert
		expect(mapper.mapToDto).toHaveBeenCalled();
		expect(result).toEqual(provisioningDto);
	});
});
