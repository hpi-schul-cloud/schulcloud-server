import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminApiRegistrationPinController } from './admin-api-registration-pin.controller';
import { RegistrationPinUc } from './registration-pin.uc';

describe('AdminApiRegistrationPinController', () => {
	let module: TestingModule;
	let sut: AdminApiRegistrationPinController;
	let registrationPinUcMock: DeepMocked<RegistrationPinUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [AdminApiRegistrationPinController],
			providers: [
				{
					provide: RegistrationPinUc,
					useValue: createMock<RegistrationPinUc>(),
				},
			],
		}).compile();

		sut = module.get(AdminApiRegistrationPinController);
		registrationPinUcMock = module.get(RegistrationPinUc);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('getRegistrationPinsForEmail', () => {
		describe('when searching for registration pins by email', () => {
			const setup = () => {
				registrationPinUcMock.findForEmail.mockResolvedValue([]);
			};

			it('should return found registration pins', async () => {
				setup();

				const result = await sut.getRegistrationPinsForEmail(faker.internet.email());

				expect(result).toEqual([]);
			});
		});
	});
});
