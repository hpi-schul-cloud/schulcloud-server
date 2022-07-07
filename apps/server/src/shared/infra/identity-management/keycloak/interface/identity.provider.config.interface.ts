import {BaseEntityWithTimestamps, EntityId} from "@shared/domain";
import {SysType} from "@shared/infra/identity-management";

// this can be the schema for the database entity
export class IIdentityProviderConfig extends BaseEntityWithTimestamps {
    type!: SysType;
    alias!: string;
    config?: Record<string, unknown>;
}

// specific type for a ldap system configuration
export interface ILDAPIdentityProviderConfig extends IIdentityProviderConfig {
    type: SysType.LDAP;
    config: {
        foo: string;
    }
}

// specific type for an oidc system configuration
export interface IOIDCIdentityProviderConfig extends IIdentityProviderConfig {
    type: SysType.OIDC;
    config: {
        bar: string;
    }
}

// we will use a discriminating union to make type narrowing possible
// and determine the specific type with typesafe member access
export type IdentityProviderConfig = ILDAPIdentityProviderConfig | IOIDCIdentityProviderConfig;

function example(providerConfig: IdentityProviderConfig): void {
    // this destructuring is also typesafe and in the following if statements we are narrowing down the possible type
    const { id, type, alias, config } = providerConfig;
    console.log(`${id}: ${alias}`);
    // inside the if statements we have typesafe access to the specific configs
    if (type === SysType.LDAP) {
        // we have typesafe access to the ldap config
        // console.log(config.bar); this results in a compilation error, bar is not available
        console.log(config.foo);
    }
    if (type === SysType.OIDC) {
        // we have typesafe access to the oidc config
        // console.log(config.foo); this results in a compilation error, foo is not available
        console.log(config.bar);
    }
}
