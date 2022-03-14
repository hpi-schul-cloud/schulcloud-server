# Keycloak
> Keycloak will be the future IAM provider for the dBildungscloud. Keycloak provides OpenID Connect, SAML 2.0 and other
> identity related functionalities like SSO out of the box. It can also act as identity broker or aggregate identities
> from third party services which can be an active directory or LDAP.

## Docker
To run Keycloak locally for development purpose use the following Bash or PowerShell command. If you don't want to block
your terminal, you can add the `-d` option to start the container in the background. Execute these commands in the
repository root or the data seeding will fail, and you can not log into Keycloak with any user.

__Bash:__
```bash
docker run \
  --name keycloak \
  -p 8080:8080 \
  -v "$PWD/backup/keycloak:/tmp/realms" \
  ghcr.io/hpi-schul-cloud/erwin-idm/dev:latest \
  "&& /opt/keycloak/bin/kc.sh import --dir /tmp/realms"
```

__PowerShell:__
```pwsh
docker run `
  --name keycloak `
  -p 8080:8080 `
  -v "$PWD/backup/keycloak:/tmp/realms" `
  ghcr.io/hpi-schul-cloud/erwin-idm/dev:latest `
  "&& /opt/keycloak/bin/kc.sh import --dir /tmp/realms"
```

## Seeding Data
During container startup Keycloak will always create the Master realm with the admin user. After startup, we use the
Keycloak-CLI to import the dBildungscloud realm, which contains some seed users, groups and permissions for development
and testing. In the table below you can see the username and password combinations for the Keycloak login.

| Username | Password | Description |
| :- | :- | :- |
| keycloak | keycloak| The overall Keycloak administrator with all permissions. |
| dBildunscloud | dBildungscloud | The dBildungscloud realm specific administrator. |
| demo-lehrer@schul-cloud.org | Schulcloud1! | A demo teacher in the dBildungscloud. |
| demo-schueler@schul-cloud.org | Schulcloud1! | A demo student in the dBildungscloud. |

The default password for all users in the dBildungscloud realm is `Schulcloud1!`.

## Updating Data

TODO describe the updating process