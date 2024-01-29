# ErWIn-IDM (Keycloak)

> ErWIn-IDM, namely Keycloak, will be the future Identity Management System (IDM) for the dBildungscloud. Keycloak
> provides OpenID Connect, SAML 2.0 and other identity related functionalities like SSO out of the box. It can
> also act as identity broker or aggregate identities from third party services which can be an active directory or LDAP.

## Docker

To run Keycloak locally for development purpose use the following Bash or PowerShell command. You can log into Keycloak
here <http://localhost:8080>. If you don't want to block your terminal, you can add the `-d` option to start the container
in the background. Execute these commands in the repository root or the data seeding will fail, and you can not log into
Keycloak with any user.

**Bash:**

```bash
docker run \
  --name erwinidm \
  -p 8080:8080 \
  -p 8443:8443 \
  -v "$PWD/backup/idm/keycloak:/tmp/realms" \
  ghcr.io/hpi-schul-cloud/erwin-idm/dev:latest \
  "&& /opt/keycloak/bin/kc.sh import --dir /tmp/realms"
```

**PowerShell:**

```pwsh
docker run `
  --name erwinidm `
  -p 8080:8080 `
  -p 8443:8443 `
  -v "$PWD/backup/idm/keycloak:/tmp/realms" `
  ghcr.io/hpi-schul-cloud/erwin-idm/dev:latest `
  "&& /opt/keycloak/bin/kc.sh import --dir /tmp/realms"
```

### Setup OpenID Connect Identity Provider mock for ErWIn-IDM brokering

To add ErWIn-IDM identity broker feature via OpenID Connect (OIDC) Identity Provider (IdP) mock follow the steps below. Execute these commands in the repository root.

- Set env vars (or in your .env file) 'OIDCMOCK\_\_BASE_URL' to http://\<your-local-ip\>:4011.
- To make it work with the nuxt client set the env var HOST=http://localhost:4000
- re-trigger `npm run setup:db:seed` and `npm run setup:idm` to reset and apply seed data.
- start the 'oidc-server-mock' as follows:

```bash
docker run \
  --name oidc-server-mock \
  -p 4011:80 \
  -e ASPNETCORE_ENVIRONMENT='Development' \
  -e SERVER_OPTIONS_PATH='/tmp/config/server-config.json' \
  -e USERS_CONFIGURATION_PATH='/tmp/config/users-config.json' \
  -e CLIENTS_CONFIGURATION_PATH='/tmp/config/clients-config.json' \
  -v "$PWD/backup/idm/oidcmock:/tmp/config" \
  ghcr.io/soluto/oidc-server-mock:0.6.0
```

**PowerShell:**

```pwsh
docker run `
  --name oidc-server-mock `
  -p 4011:80 `
  -e ASPNETCORE_ENVIRONMENT='Development' `
  -e SERVER_OPTIONS_PATH='/tmp/config/server-config.json' `
  -e USERS_CONFIGURATION_PATH='/tmp/config/users-config.json' `
  -e CLIENTS_CONFIGURATION_PATH='/tmp/config/clients-config.json' `
  -v "$PWD/backup/idm/oidcmock:/tmp/config" `
  ghcr.io/soluto/oidc-server-mock:0.6.0
```

### Setup OpenID Connect Identity Provider mock for ErWIn-IDM brokering with LDAP provisioning

The broker feature can be setup in conjunction with LDAP provisioning for local testing purpose. Therefore, run the sc-openldap-single container:

```bash
docker run \
  --name sc-openldap-single \
  -p 389:389 \
  ghcr.io/hpi-schul-cloud/sc-openldap-single:latest
```

```pwsh
docker run `
  --name sc-openldap-single `
  -p 389:389 `
  ghcr.io/hpi-schul-cloud/sc-openldap-single:latest
```

The LDAP provisioning is trigger as follows:

```bash
curl -X POST \
  'http://localhost:3030/api/v1/sync?target=ldap' \
  --header 'Accept: */*' \
  --header 'X-API-KEY: example'
```

```pwsh
Invoke-RestMethod `
 -Uri 'http://localhost:3030/api/v1/sync?target=ldap' `
 -Method Post `
 -Headers @{ "Accept" = "*/*"; "X-API-KEY" = "example" }
```

See '/tmp/config/users-config.json' for the users details.

## Test local environment

You may test your local setup executing 'keycloak-identity-management.integration.spec.ts':

```pwsh
npx jest apps/server/src/shared/infra/identity-management/keycloak/service/keycloak-identity-management.service.integration.spec.ts
```

## Seeding Data

During container startup Keycloak will always create the Master realm with the admin user. After startup, we use the
Keycloak-CLI to import the dBildungscloud realm, which contains some seed users, groups and permissions for development
and testing. In the table below you can see the username and password combinations for the Keycloak login.

| Username       | Password       | Description                                              |
| :------------- | :------------- | :------------------------------------------------------- |
| keycloak       | keycloak       | The overall Keycloak administrator with all permissions. |
| dbildungscloud | dBildungscloud | The dBildungscloud realm specific administrator.         |

## Updating Seed Data

1. Run Keycloak and make the desired changes
2. Use `docker container exec -it keycloak bash` to start a bash in the container
3. Use the Keycloak-CLI to export all Keycloak data with `/opt/keycloak/bin/kc.sh export --dir /tmp/realms`
4. Save your changes with a commit
5. If you start your container with a command from the docker section, your changes will be directly applied to the starting Keycloak container

> IMPORTANT: During the export process there will be some errors, that's because the export process will be done on the
> same port as the Keycloak server. This leads to Keycloak failing to start the server in import/export mode. Due to the
> transition from WildFly to Quarkus as application server there is currently no documentation on this topic.

In order to re-apply the seeding data for a running keycloak container, you may run following commands (to be executed in the repository root):

1. `docker cp ./backup/idm/keycloak keycloak:/tmp/realms`
2. `docker exec erwinidm /opt/keycloak/bin/kc.sh import --dir /tmp/realms`

## NPM Commands

A list of available NPM commands regarding Keycloak / IDM.

| Command             | Description                                                                   |
| :------------------ | :---------------------------------------------------------------------------- |
| setup:idm:seed      | Seeds users for development and testing purpose into the IDM                  |
| setup:idm:configure | Configures identity and authentication providers and other details in the IDM |
