import { createMock } from '@golevelup/ts-jest';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { DefaultEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { SysType } from '../../sys.type';
import { IOidcIdentityProviderConfig } from '../interface';
import { OidcIdentityProviderMapper } from './identity-provider.mapper';

describe('OidcIdentityProviderMapper', () => {
	let module: TestingModule;
	let mapper: OidcIdentityProviderMapper;
	let defaultEncryptionService: SymetricKeyEncryptionService;

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				OidcIdentityProviderMapper,
				{ provide: DefaultEncryptionService, useValue: createMock<SymetricKeyEncryptionService>() },
			],
		}).compile();
		defaultEncryptionService = module.get(DefaultEncryptionService);
		jest.spyOn(defaultEncryptionService, 'encrypt').mockImplementation((data) => `${data}_enc`);
		jest.spyOn(defaultEncryptionService, 'decrypt').mockImplementation((data) => `${data}_dec`);

		mapper = module.get(OidcIdentityProviderMapper);
	});

	describe('mapToKeycloakIdentityProvider', () => {
		const brokerFlowAlias = 'flow';
		const internalRepresentation: IOidcIdentityProviderConfig = {
			_id: new ObjectId(0),
			id: new ObjectId(0).toString(),
			type: SysType.OIDC,
			alias: 'alias',
			config: {
				clientId: 'clientId',
				clientSecret: 'clientSecret',
				authorizationUrl: 'authorizationUrl',
				tokenUrl: 'tokenUrl',
				logoutUrl: 'logoutUrl',
				userinfoUrl: 'userinfoUrl',
				defaultScopes: 'defaultScopes',
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const keycloakRepresentation: IdentityProviderRepresentation = {
			providerId: 'oidc',
			alias: 'alias',
			enabled: true,
			firstBrokerLoginFlowAlias: brokerFlowAlias,
			config: {
				clientId: 'clientId_dec',
				clientSecret: 'clientSecret_dec',
				authorizationUrl: 'authorizationUrl',
				tokenUrl: 'tokenUrl',
				logoutUrl: 'logoutUrl',
				userInfoUrl: 'userinfoUrl',
				defaultScope: 'defaultScopes',
				syncMode: 'IMPORT',
				sync_mode: 'import',
				clientAuthMethod: 'client_secret_post',
				backchannelSupported: 'true',
				prompt: 'login',
			},
		};

		it('should map all fields', () => {
			const ret = mapper.mapToKeycloakIdentityProvider(internalRepresentation, brokerFlowAlias);

			expect(ret).toEqual(keycloakRepresentation);
		});
		it('should decrypt secrets', () => {
			const ret = mapper.mapToKeycloakIdentityProvider(internalRepresentation, brokerFlowAlias);

			expect(ret).toEqual(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					config: expect.objectContaining({
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						clientId: expect.stringMatching('.*dec'),
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						clientSecret: expect.stringMatching('.*dec'),
					}),
				})
			);
		});
		it('should map the flow argument', () => {
			const ret = mapper.mapToKeycloakIdentityProvider(internalRepresentation, brokerFlowAlias);

			expect(ret).toEqual(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					firstBrokerLoginFlowAlias: brokerFlowAlias,
				})
			);
		});
	});
});
