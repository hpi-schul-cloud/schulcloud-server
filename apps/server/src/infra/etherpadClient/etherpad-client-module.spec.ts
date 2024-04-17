import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EtherpadClientModule } from './etherpad-client-module';
import { EtherpadRestClientOptions } from './etherpad-rest-client-options';
import { EtherpadRestClient } from './etherpad-rest-client';

describe('EtherpadClientModule', () => {
	let module: TestingModule;
	const clientOptions: EtherpadRestClientOptions = {
		apiUri: 'https://etherpad.url/api',
		cookieExpirationInSeconds: 7200,
		cookieReleaseThreshold: 7200,
		apiKey: '123666131dadaddsa',
	};

	let clientModule: EtherpadClientModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				EtherpadClientModule.register(clientOptions),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
			],
			providers: [
				{
					provide: EtherpadRestClient,
					useValue: createMock<EtherpadRestClient>(),
				},
			],
		}).compile();

		clientModule = module.get(EtherpadClientModule);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when EtherpadClient is initialized with register method', () => {
		it('should be defined', () => {
			expect(clientModule).toBeDefined();
		});
	});
});
