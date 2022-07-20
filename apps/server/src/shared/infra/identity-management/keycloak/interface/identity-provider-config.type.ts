import { IOidcIdentityProviderConfig } from './oidc-identity-provider-config.interface';
import { ILdapIdentityProviderConfig } from './ldap-identity-provider-config.interface';

export type IdentityProviderConfig = IOidcIdentityProviderConfig | ILdapIdentityProviderConfig;
