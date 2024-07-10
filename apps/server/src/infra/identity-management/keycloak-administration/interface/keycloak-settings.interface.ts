export const KeycloakSettings = Symbol('KeycloakSettings');

export interface IKeycloakSettings {
	internalBaseUrl: string; // http://erwinidm-svc:8089
	externalBaseUrl: string; // https://idm-...
	realmName: string;
	clientId: string;
	credentials: {
		username: string;
		password: string;
		grantType: 'password';
		clientId: string;
	};
}
