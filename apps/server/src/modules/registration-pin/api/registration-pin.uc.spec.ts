import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { registrationPinEntityFactory } from '../entity/testing';
import { RegistrationPinService } from '../service';
import { RegistrationPinUc } from './registration-pin.uc';

describe('RegistrationPinUc', () => {
	let module: TestingModule;
	let sut: RegistrationPinUc;
	let registrationPinServiceMock: DeepMocked<RegistrationPinService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RegistrationPinUc,
				{
					provide: RegistrationPinService,
					useValue: createMock<RegistrationPinService>(),
				},
			],
		}).compile();

		sut = module.get(RegistrationPinUc);
		registrationPinServiceMock = module.get(RegistrationPinService);
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

	describe('findForEmail', () => {
		describe('when finding registration pins for email', () => {
			const setup = () => {
				const registrationPin = registrationPinEntityFactory.build();

				registrationPinServiceMock.findByEmail.mockResolvedValue([registrationPin]);
			};

			it('should return found registration pins', async () => {
				setup();

				const result = await sut.findForEmail(faker.internet.email());

				expect(result).toHaveLength(1);
			});
		});
	});
});
