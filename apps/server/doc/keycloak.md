# Keycloak

> Keycloak will be the future IAM provider for the dBildungscloud. Keycloak provides OpenID Connect, SAML 2.0 and other
> identity related functionalities like SSO out of the box. It can also act as identity broker or aggregate identities
> from third party services which can be an active directory or LDAP.

## Docker

To run Keycloak locally for development purpose use the following Bash or PowerShell command. You can log into Keycloak
here <http://localhost:8080>. If you don't want to block your terminal, you can add the `-d` option to start the container
in the background. Execute these commands in the repository root or the data seeding will fail, and you can not log into
Keycloak with any user.

**Bash:**

```bash
docker run \
  --name keycloak \
  -p 8080:8080 \
  -p 8443:8443 \
  -v "$PWD/backup/keycloak:/tmp/realms" \
  ghcr.io/hpi-schul-cloud/erwin-idm/dev:latest \
  "&& /opt/keycloak/bin/kc.sh import --dir /tmp/realms"
```

**PowerShell:**

```pwsh
docker run `
  --name keycloak `
  -p 8080:8080 `
  -p 8443:8443 `
  -v "$PWD/backup/keycloak:/tmp/realms" `
  ghcr.io/hpi-schul-cloud/erwin-idm/dev:latest `
  "&& /opt/keycloak/bin/kc.sh import --dir /tmp/realms"
```

## Test local environment

You may test your local setup executing 'keycloak-identity-management.integration.spec.ts':

```pwsh
npx jest apps/server/src/shared/infra/identity-management/keycloak-identity-management.integration.spec.ts
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

1. `docker cp ./backup/keycloak keycloak:/tmp/realms`
2. `docker exec keycloak /opt/keycloak/bin/kc.sh import --dir /tmp/realms`
