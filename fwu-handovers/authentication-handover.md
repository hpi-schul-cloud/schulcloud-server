# Technical Handover: Authentication Flows

## Document Purpose & Structure

This document guides new developers through the authentication-related code in the SVS (Schulcloud-Verbund-Software). It is designed to be presented by someone familiar with the code, not read in isolation. The structure follows a logical learning path: concepts → login flows → token lifecycle → supporting modules → practical guidance.

**Prerequisites:** Familiarity with the [general architecture patterns](https://documentation.dbildungscloud.dev/docs/backend-design-patterns/architecture), especially the three-layer model (API → Domain → Repository) and NestJS module conventions.

**Out of scope:** The specifics of TSP, Moin.Schule/Schulconnex, and LDAP sync flows are covered in separate handovers. They are mentioned here only where they intersect with the core authentication flow.

---

## 1. Overview & Conceptual Foundation

### 1.1 What Does "Authentication" Mean Here?

Authentication in the SVS answers: **"Who is this user, and can we trust their identity?"** It covers:

1. **Login** – Verifying credentials and issuing a JWT
2. **Request validation** – Checking the JWT on every subsequent request
3. **Session management** – Tracking active JWTs via Valkey (Redis-compatible store)
4. **Logout** – Invalidating sessions (local, OIDC backchannel, external system)

**Authentication ≠ Authorization.** Authentication establishes *who* the user is. Authorization (handled separately by the `AuthorizationModule`) determines *what* they can do.

### 1.2 Two-Application Architecture

The SVS runs **two applications in one process:**

| Application | Technology | Authentication Role |
|-------------|-----------|---------------------|
| **Feathers app** (legacy) | FeathersJS | Still validates JWTs for legacy service hooks |
| **NestJS app** | NestJS | Handles all login flows, issues JWTs, manages sessions |

**Critical shared state:** Both apps share the same **JWT whitelist in Valkey** and use the **same RSA key pair** for signing/verifying JWTs. This means a JWT issued by the NestJS login endpoint is valid for Feathers service calls and vice versa.

📁 The bridge between them: [imports-from-feathers.ts](../apps/server/src/imports-from-feathers.ts) – NestJS imports `createRedisIdentifierFromJwtData`, `ensureTokenIsWhitelisted`, and `getRedisData` directly from the Feathers codebase.

### 1.3 JWT Basics (Project-Specific)

JWTs in the SVS use **RS256 asymmetric signing:**

| Aspect | Detail |
|--------|--------|
| Algorithm | `RS256` (RSA + SHA-256) |
| Private key | Signs JWTs (config: `JWT_PRIVATE_KEY`) |
| Public key | Verifies JWTs (config: `JWT_PUBLIC_KEY`) |
| Issuer / Audience | `SC_DOMAIN` (e.g., `schulcloud.de`) |
| Default lifetime | `30d` (configurable via `JWT_LIFETIME`) |

📁 JWT config: [jwt-module.config.ts](../apps/server/src/modules/authentication/jwt-module.config.ts)

**Payload structure (`CreateJwtPayload`):**

```typescript
interface CreateJwtPayload {
    accountId: string;      // The Account's ID (also used as JWT subject)
    userId: string;         // The User entity ID
    schoolId: string;       // User's school
    roles: string[];        // Role IDs (not names!)
    isServiceAccount: boolean;
    systemId?: string;      // External system (LDAP/OAuth) if applicable
    support: boolean;       // True if SHD is impersonating
    supportUserId?: string; // The actual SHD user ID
    isExternalUser: boolean; // True for OAuth/LDAP users
}
```

📁 [jwt-payload.ts](../apps/server/src/infra/auth-guard/interface/jwt-payload.ts)

---

## 2. Module Architecture

### 2.1 Module Layering

Authentication spans several NestJS modules, each with a clear responsibility:

| Module | Purpose | File |
|--------|---------|------|
| `AuthenticationModule` | Core: strategies, services, JWT generation, Valkey integration | [authentication.module.ts](../apps/server/src/modules/authentication/authentication.module.ts) |
| `AuthenticationApiModule` | REST controllers + use cases for login/logout | [authentication-api.module.ts](../apps/server/src/modules/authentication/authentication-api.module.ts) |
| `AuthGuardModule` | Infra: JWT/WS-JWT/X-API-Key validation decorators & guards | [auth-guard.module.ts](../apps/server/src/infra/auth-guard/auth-guard.module.ts) |
| `AccountModule` | Account domain: credentials, lookup, lifecycle | [account.module.ts](../apps/server/src/modules/account/account.module.ts) |
| `AccountApiModule` | Account REST API (admin CRUD) | [account-api.module.ts](../apps/server/src/modules/account/account-api.module.ts) |
| `UserModule` | User domain: entity, roles, profile | [user.module.ts](../apps/server/src/modules/user/user.module.ts) |
| `OauthModule` | OAuth token exchange, user provisioning | [oauth.module.ts](../apps/server/src/modules/oauth/oauth.module.ts) |
| `OAuthApiModule` | OAuth session token API | [oauth-api.module.ts](../apps/server/src/modules/oauth/oauth-api.module.ts) |
| `OauthProviderModule` | SVS acting as OAuth *provider* (Hydra integration) | [oauth-provider.module.ts](../apps/server/src/modules/oauth-provider/oauth-provider.module.ts) |

```
┌─────────────────────────────────────────────────────────────┐
│               AuthenticationApiModule                       │
│  (LoginController, LogoutController, LoginUc, LogoutUc)     │
├─────────────────────────────────────────────────────────────┤
│               AuthenticationModule                          │
│  (Strategies, AuthenticationService, JwtWhitelistAdapter)   │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐ │
│  │ Local     │  │ LDAP     │  │ OAuth2    │  │ Erwin     │ │
│  │ Strategy  │  │ Strategy │  │ Strategy  │  │ Strategy  │ │
│  └───────────┘  └──────────┘  └───────────┘  └───────────┘ │
├─────────────────────────────────────────────────────────────┤
│   AccountModule    │   UserModule    │    OauthModule       │
│   (Accounts DO,    │   (User Entity, │    (Token exchange,  │
│    AccountService) │    UserService) │     Provisioning)    │
├─────────────────────────────────────────────────────────────┤
│                    AuthGuardModule (infra)                   │
│  (JwtStrategy, WsJwtStrategy, XApiKeyStrategy, Decorators)  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure (Authentication Module)

```
authentication/
├── controllers/
│   ├── login.controller.ts         # POST /authentication/{local,ldap,oauth2}
│   ├── logout.controller.ts        # POST /logout, /logout/oidc, /logout/external
│   ├── dto/                        # Request/response DTOs
│   └── mapper/                     # LoginResponseMapper
├── helper/
│   ├── jwt-whitelist.adapter.ts    # Valkey whitelist operations
│   └── oauth2-context.helper.ts    # OAuth2 flow orchestration
├── interface/
│   ├── strategy-type.ts            # Enum: LOCAL, LDAP, OAUTH2, ERWIN
│   ├── oauth-current-user.ts       # OauthCurrentUser type
│   └── oauth2-context-result.ts    # OAuth2 context result type
├── mapper/
│   └── current-user.mapper.ts      # Maps User/Account → ICurrentUser
├── services/
│   ├── authentication.service.ts   # JWT generation, account loading, brute force
│   ├── ldap.service.ts             # LDAP bind for credential checks
│   └── logout.service.ts           # OIDC/external logout logic
├── strategy/
│   ├── local.strategy.ts           # Username/password via bcrypt
│   ├── ldap.strategy.ts            # LDAP bind authentication
│   ├── oauth2.strategy.ts          # OAuth2 code exchange
│   └── erwin.strategy.ts           # Erwin IdP (OAuth2 variant)
├── uc/
│   ├── login.uc.ts                 # JWT creation use case
│   └── logout.uc.ts                # JWT removal use case
├── authentication.module.ts        # Core module definition
├── authentication-api.module.ts    # API module definition
├── authentication-config.ts        # Configuration class
└── jwt-module.config.ts            # JWT signing configuration
```

---

## 3. Login Flows in Detail

### 3.1 High-Level Login Flow (All Strategies)

Every login follows the same pattern, regardless of strategy:

```
Client Request (POST /authentication/{strategy})
    │
    ▼
LoginController (applies AuthGuard for the strategy)
    │
    ▼
Passport Strategy.validate()
    │  ┌─────────────────────────────────────────────┐
    │  │ Strategy-specific credential verification:   │
    │  │ • Local: bcrypt compare                      │
    │  │ • LDAP: LDAP bind                            │
    │  │ • OAuth2: Token exchange + provisioning       │
    │  │ • Erwin: Token exchange + provisioning         │
    │  └─────────────────────────────────────────────┘
    │  Returns: ICurrentUser (attached to request)
    ▼
LoginUc.getLoginData(currentUser)
    │
    ├─► JwtPayloadBuilder.build() → CreateJwtPayload
    ├─► AuthenticationService.generateJwtAndAddToWhitelist()
    │   ├─► JwtService.sign() (RSA private key)
    │   └─► JwtWhitelistAdapter.addToWhitelist() (Valkey)
    └─► AuthenticationService.updateLastLogin()
    │
    ▼
LoginResponse { accessToken: "eyJ..." }
```

📁 [login.controller.ts](../apps/server/src/modules/authentication/controllers/login.controller.ts)
📁 [login.uc.ts](../apps/server/src/modules/authentication/uc/login.uc.ts)

### 3.2 Local Strategy (Username/Password)

**Endpoint:** `POST /authentication/local`
**Body:** `{ username, password }`

📁 [local.strategy.ts](../apps/server/src/modules/authentication/strategy/local.strategy.ts)

**Flow:**
1. Normalize `username` (trim + lowercase) and `password` (trim)
2. `AuthenticationService.loadAccount(username)` – find account without `systemId` (local accounts only)
3. Check brute force protection (`LOGIN_BLOCK_TIME`, default 15 minutes)
4. `bcrypt.compare(password, account.password)` – verify password
5. Load `User` entity with roles
6. Build `ICurrentUser` from User + Account

**Special variant:** `POST /authentication/local-service-account` – same strategy, but calls `LoginUc.getLoginDataForServiceAccount()` which:
- Validates `currentUser.isServiceAccount === true`
- Uses a shorter JWT lifetime (`JWT_LIFETIME_SERVICE_ACCOUNT_SECONDS`, default 2 hours)
- Logs the authentication via `AuditLogger`

### 3.3 LDAP Strategy

**Endpoint:** `POST /authentication/ldap`
**Body:** `{ username, password, systemId, schoolId }`

📁 [ldap.strategy.ts](../apps/server/src/modules/authentication/strategy/ldap.strategy.ts)

**Flow:**
1. Validate that the school has the specified system configured
2. Load account by `{externalSchoolId}/{username}` + `systemId`
   - Falls back to `{previousExternalId}/{username}` if the school's external ID changed
3. Check brute force protection
4. Load User entity to get `ldapDn`
5. `LdapService.checkLdapCredentials(system, ldapDn, password)` – performs an LDAP bind against the external directory
6. Build `ICurrentUser` with `isExternalUser: true` and `systemId`

📁 [ldap.service.ts](../apps/server/src/modules/authentication/services/ldap.service.ts)

> **Note:** The LDAP strategy only validates credentials. LDAP *sync* (importing users, schools, classes) is a separate process covered in a different handover.

### 3.4 OAuth2 Strategy

**Endpoint:** `POST /authentication/oauth2`
**Body:** `{ systemId, redirectUri, code }`

📁 [oauth2.strategy.ts](../apps/server/src/modules/authentication/strategy/oauth2.strategy.ts)

This is the most complex strategy. The heavy lifting is delegated to `Oauth2ContextHelper`:

📁 [oauth2-context.helper.ts](../apps/server/src/modules/authentication/helper/oauth2-context.helper.ts)

**Flow:**
```
Oauth2ContextHelper.buildOauth2Context(params)
    │
    ├─► OAuthService.authenticateUser(systemId, redirectUri, code)
    │   │
    │   ├─► Load System + OauthConfig from DB
    │   ├─► Request tokens from IdP token endpoint (authorization code grant)
    │   └─► Validate ID token (RS256 signature, issuer, audience)
    │
    ├─► OAuthService.provisionUser(systemId, idToken, accessToken)
    │   │
    │   ├─► ProvisioningService.getData() → fetch external user data
    │   ├─► Check migration status (shouldUserMigrate?)
    │   ├─► ProvisioningService.provisionData() → create/update User
    │   └─► Find and return the provisioned UserDo
    │
    ├─► AccountService.findByUserId() → find matching Account
    │
    ├─► Check account not deactivated
    │
    └─► (If external logout enabled) Save OauthSessionToken
        with the refresh token for later logout
```

📁 [oauth.service.ts](../apps/server/src/modules/oauth/service/oauth.service.ts)

The returned `OauthLoginResponse` includes the **external IdP's ID token** alongside the SVS JWT, so the client can use it for external interactions.

### 3.5 Erwin Strategy

**Endpoint:** `POST /authentication/erwin` (if registered)

📁 [erwin.strategy.ts](../apps/server/src/modules/authentication/strategy/erwin.strategy.ts)

Functionally identical to OAuth2 strategy (reuses `Oauth2ContextHelper`), but produces a slightly different `ICurrentUser` mapping via `CurrentUserMapper.mapToErwinCurrentUser()`.

### 3.6 Strategy Registration Summary

| Strategy | Passport Name | NestJS Class | Auth Mechanism |
|----------|--------------|--------------|----------------|
| Local | `local` | `LocalStrategy` | bcrypt password comparison |
| LDAP | `ldap` | `LdapStrategy` | LDAP bind (external directory) |
| OAuth2 | `oauth2` | `Oauth2Strategy` | Authorization code + token exchange |
| Erwin | `erwin` | `ErwinStrategy` | Authorization code + token exchange |

All strategies are registered in [authentication.module.ts](../apps/server/src/modules/authentication/authentication.module.ts).

---

## 4. JWT Whitelisting & Session Management (Valkey)

### 4.1 Why Whitelisting?

JWTs are typically stateless, but the SVS adds a **stateful session layer** using Valkey (Redis-compatible) to support:
- **Auto-logout on inactivity** – sessions expire if not refreshed
- **Forced logout** – admins/OIDC can invalidate specific sessions
- **Multi-device tracking** – each JWT gets a unique `jti`

### 4.2 How It Works

**Key format in Valkey:** `jwt:{accountId}:{jti}`

```
jwt:60f1a2b3c4d5e6f7g8h9i0j1:550e8400-e29b-41d4-a716-446655440000
```

**Data stored:**
```json
{
    "IP": "NONE",
    "Browser": "NONE",
    "Device": "NONE",
    "privateDevice": false,
    "expirationInSeconds": 7200
}
```

**Lifecycle:**

| Action | Where | What Happens |
|--------|-------|-------------|
| **Login** | `AuthenticationService.generateJwtAndAddToWhitelist()` | New key created with TTL |
| **Each request** | `JwtValidationAdapter.isWhitelisted()` → `ensureTokenIsWhitelisted()` | TTL is **refreshed** (extended) if the key exists |
| **Logout** | `AuthenticationService.removeJwtFromWhitelist()` | Single key deleted |
| **Force logout (all sessions)** | `AuthenticationService.removeUserFromWhitelist()` | All keys matching `jwt:{accountId}:*` deleted |
| **Inactivity timeout** | Valkey TTL expiry | Key auto-deleted → next request fails validation |

📁 [jwt-whitelist.adapter.ts](../apps/server/src/modules/authentication/helper/jwt-whitelist.adapter.ts)
📁 [whitelist.js](../src/services/authentication/logic/whitelist.js) (shared Feathers implementation)

### 4.3 Timeout Configuration

| Config Key | Default | Purpose |
|-----------|---------|---------|
| `JWT_TIMEOUT_SECONDS` | 7200 (2h) | Session inactivity timeout |
| `JWT_EXTENDED_TIMEOUT_SECONDS` | – | Extended timeout for private devices |
| `FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED` | false | Enable private device extension |

### 4.4 Shared Whitelist Between Feathers & NestJS

Both applications access the **same Valkey instance** with the **same key format**:

- **NestJS** uses `JwtWhitelistAdapter` → `StorageClient` (via `ValkeyClientModule`)
- **Feathers** uses `getRedisClient()` → `redisSetAsync/redisGetAsync` (via `src/utils/redis.js`)

The NestJS `JwtValidationAdapter` calls directly into the Feathers whitelist code:

```typescript
// apps/server/src/infra/auth-guard/adapter/jwt-validation.adapter.ts
import { ensureTokenIsWhitelisted } from '@imports-from-feathers';

async isWhitelisted(accountId: string, jti: string): Promise<void> {
    await ensureTokenIsWhitelisted({ accountId, jti, privateDevice: false });
}
```

📁 [jwt-validation.adapter.ts](../apps/server/src/infra/auth-guard/adapter/jwt-validation.adapter.ts)

---

## 5. Request Authentication (Auth Guard Infra)

### 5.1 Overview

Once a JWT is issued, every subsequent request must be validated. This is handled by the `AuthGuardModule` in `@infra/auth-guard`.

```
Incoming Request
    │
    ▼
Decorator (@JwtAuthentication / @WsJwtAuthentication / @XApiKeyAuthentication)
    │ applies UseGuards(...)
    ▼
Guard (JwtAuthGuard / WsJwtAuthGuard / XApiKeyGuard)
    │ delegates to Passport
    ▼
Strategy (JwtStrategy / WsJwtStrategy / XApiKeyStrategy)
    │
    ├─► Verify JWT signature (RSA public key)
    ├─► Check whitelist (Valkey) + extend TTL
    └─► Build ICurrentUser from payload
    │
    ▼
Request proceeds with currentUser attached
```

### 5.2 Three Validation Strategies

| Strategy | Use | Token Location | Failure Type |
|----------|-----|---------------|--------------|
| `JwtStrategy` | REST API endpoints | `Authorization: Bearer <jwt>` header | `UnauthorizedException` (HTTP 401) |
| `WsJwtStrategy` | WebSocket connections | Cookie `jwt=<token>` | `WsException` |
| `XApiKeyStrategy` | Server-to-server calls | `X-API-KEY` header | `UnauthorizedException` (HTTP 401) |

📁 [jwt.strategy.ts](../apps/server/src/infra/auth-guard/strategy/jwt.strategy.ts)
📁 [ws-jwt.strategy.ts](../apps/server/src/infra/auth-guard/strategy/ws-jwt.strategy.ts)
📁 [x-api-key.strategy.ts](../apps/server/src/infra/auth-guard/strategy/x-api-key.strategy.ts)

> **Note:** The X-API-Key strategy is nearly deprecated and will be replaced by service account logins based on the JWT strategy.

### 5.3 Decorators

Developers protect endpoints using these decorators:

```typescript
// REST endpoints (most common)
@JwtAuthentication()
@Controller('my-resource')
export class MyController {
    myMethod(@CurrentUser() user: ICurrentUser, @JWT() jwt: string) { ... }
}

// WebSocket gateways
@WsJwtAuthentication()
@WebSocketGateway()
export class MyGateway { ... }

// Server-to-server (deprecated)
@XApiKeyAuthentication()
@Controller('internal')
export class InternalController { ... }
```

| Decorator | File | What It Does |
|-----------|------|-------------|
| `@JwtAuthentication()` | [jwt-auth.decorator.ts](../apps/server/src/infra/auth-guard/decorator/jwt-auth.decorator.ts) | Applies `JwtAuthGuard` + `@ApiBearerAuth()` for OpenAPI |
| `@CurrentUser()` | [jwt-auth.decorator.ts](../apps/server/src/infra/auth-guard/decorator/jwt-auth.decorator.ts) | Extracts `ICurrentUser` from request |
| `@JWT()` | [jwt-auth.decorator.ts](../apps/server/src/infra/auth-guard/decorator/jwt-auth.decorator.ts) | Extracts raw JWT string from request |
| `@WsJwtAuthentication()` | [ws-jwt-auth.decorator.ts](../apps/server/src/infra/auth-guard/decorator/ws-jwt-auth.decorator.ts) | Applies `WsJwtAuthGuard` |
| `@XApiKeyAuthentication()` | [x-api-key.decorator.ts](../apps/server/src/infra/auth-guard/decorator/x-api-key.decorator.ts) | Applies `XApiKeyGuard` |

### 5.4 ICurrentUser Interface

Every authenticated request populates an `ICurrentUser` that downstream code can use:

```typescript
interface ICurrentUser {
    userId: EntityId;
    roles: EntityId[];          // Role IDs (not names!)
    schoolId: EntityId;
    accountId: EntityId;
    systemId?: EntityId;        // Set for external (OAuth/LDAP) users
    isServiceAccount: boolean;
    support: boolean;           // True if SHD impersonation
    supportUserId?: EntityId;
    isExternalUser: boolean;
    externalIdToken?: string;   // The external IdP's ID token (OAuth only)
}
```

📁 [user.ts](../apps/server/src/infra/auth-guard/interface/user.ts)

### 5.5 AuthGuardModule Registration

The `AuthGuardModule` uses a dynamic `register()` pattern. Each server module that needs authentication registers the guards it needs:

```typescript
AuthGuardModule.register([
    { option: AuthGuardOptions.JWT, configInjectionToken: ..., configConstructor: ... },
    { option: AuthGuardOptions.WS_JWT, ... },
    { option: AuthGuardOptions.X_API_KEY, ... },
])
```

📁 [auth-guard.module.ts](../apps/server/src/infra/auth-guard/auth-guard.module.ts)

---

## 6. Logout Flows

### 6.1 Standard Logout

**Endpoint:** `POST /logout` (JWT required)

📁 [logout.controller.ts](../apps/server/src/modules/authentication/controllers/logout.controller.ts)

Simply removes the current JWT from the Valkey whitelist:

```
LogoutController.logout(@JWT() jwt)
    └─► LogoutUc.logout(jwt)
        └─► AuthenticationService.removeJwtFromWhitelist(jwt)
            ├─► Decode JWT to extract { accountId, jti }
            └─► JwtWhitelistAdapter.removeFromWhitelist(accountId, jti)
                └─► Valkey: DEL jwt:{accountId}:{jti}
```

### 6.2 OIDC Backchannel Logout

**Endpoint:** `POST /logout/oidc` (NO JWT required – called by external IdP)

Implements [OpenID Connect Back-Channel Logout 1.0](https://openid.net/specs/openid-connect-backchannel-1_0.html).

```
External IdP calls POST /logout/oidc with { logout_token }
    │
    ▼
LogoutUc.logoutOidc(logoutToken)
    │
    ├─► LogoutService.getAccountFromLogoutToken(logoutToken)
    │   ├─► Decode logout token → extract issuer + subject
    │   ├─► SystemService.findByOauth2Issuer(issuer) → find matching System
    │   ├─► OAuthService.validateLogoutToken() → verify signature + events claim
    │   ├─► UserService.findByExternalId(sub, systemId) → find User
    │   └─► AccountService.findByUserId() → find Account
    │
    └─► AuthenticationService.removeUserFromWhitelist(account)
        └─► JwtWhitelistAdapter.removeFromWhitelist(accountId)
            └─► Valkey: KEYS jwt:{accountId}:* → DEL all matching keys
```

📁 [logout.service.ts](../apps/server/src/modules/authentication/services/logout.service.ts)

This invalidates **all sessions** for the user, not just one.

### 6.3 External System Logout

**Endpoint:** `POST /logout/external` (JWT required, feature-flagged)

Logs the user out from the *external* IdP by calling its `end_session_endpoint`:

```
LogoutUc.externalSystemLogout(user)
    │
    ├─► Check FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED
    ├─► Load System + OauthConfig
    ├─► Find OauthSessionToken (stored during OAuth2 login)
    └─► POST to system.oauthConfig.endSessionEndpoint
        with { refresh_token } + client credentials
```

📁 [oauth-session-token.ts](../apps/server/src/modules/oauth/domain/do/oauth-session-token.ts) – stores the refresh token from login for later logout use.

---

## 7. Feathers Legacy Authentication

### 7.1 How Feathers Authentication Works

📁 [src/services/authentication/index.js](../src/services/authentication/index.js)

The Feathers app registers its own authentication service at `/authentication`:

```javascript
class SCAuthenticationService extends AuthenticationService {
    async getPayload(authResult, params) {
        // Enriches JWT payload with userId, schoolId, roles, accountId, systemId
    }
}
```

**Feathers strategies:**
- `CustomJwtStrategy` – Validates JWTs (also checks cookies). Uses `nest-account-service` to find accounts, bridging into NestJS.
- `ApiKeyStrategy` – Validates `X-API-KEY` headers

📁 [JwtStrategy.js](../src/services/authentication/strategies/JwtStrategy.js)

### 7.2 Feathers Auth Hooks

📁 [src/services/authentication/hooks/index.js](../src/services/authentication/hooks/index.js)

| Hook | Phase | Purpose |
|------|-------|---------|
| `checkJwtAuthWhitelisted` | `before.create` | Checks JWT whitelist for `jwt` strategy re-authentication |
| `addJwtToWhitelist` | `after.create` | Adds newly created JWT to Valkey whitelist |
| `removeJwtFromWhitelist` | `after.remove` | Removes JWT from Valkey whitelist on logout |

### 7.3 Feathers Configuration

📁 [configuration.js](../src/services/authentication/configuration.js)

Key settings:
- Uses the same `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` as NestJS
- Same `SC_DOMAIN` as issuer/audience
- `authStrategies: ['jwt', 'api-key']` – only validation, not login (login moved to NestJS)

> **Important:** Login creation is handled exclusively by the NestJS `LoginController`. The Feathers authentication service only validates existing JWTs for legacy service hooks that use `authenticate('jwt')`.

---

## 8. Account Module

### 8.1 Concept: Account vs. User

This distinction is fundamental:

| Concept | What It Represents | Key Identifiers |
|---------|-------------------|-----------------|
| **Account** | *Credentials + authentication metadata* | `username`, `password`, `systemId` |
| **User** | *Person in the educational context* | `firstName`, `lastName`, `email`, `roles`, `school` |

**One User can have one Account.** The `Account.userId` links to the `User`. An Account without a `systemId` is a local account (password-based). An Account *with* a `systemId` is an external account (LDAP/OAuth – the password may be `null`).

### 8.2 Account Domain Object

📁 [account.ts](../apps/server/src/modules/account/domain/do/account.ts)

```typescript
class Account extends DomainObject<AccountProps> {
    id: EntityId
    userId?: EntityId            // Link to User
    systemId?: EntityId          // External system (null = local)
    username: string             // Login identifier
    password?: string            // Bcrypt hash (null for external accounts)
    lastLogin?: Date             // Last successful login
    lasttriedFailedLogin?: Date  // For brute force detection
    deactivatedAt?: Date         // Account deactivation timestamp
    activated?: boolean          // Account activation flag
    expiresAt?: Date             // Account expiry
}
```

### 8.3 Account Entity

📁 [account.entity.ts](../apps/server/src/modules/account/repo/account.entity.ts)

Stored in the `accounts` MongoDB collection. Indexed on `username`, `userId + systemId`.

### 8.4 Account Services

| Service | Purpose | File |
|---------|---------|------|
| `AccountService` | Public facade: search, update, validate password | [account.service.ts](../apps/server/src/modules/account/domain/services/account.service.ts) |
| `AccountServiceDb` | Internal DB operations via repo | [account-db.service.ts](../apps/server/src/modules/account/domain/services/account-db.service.ts) |

Key operations of `AccountService`:
- `findByUserId()` / `findByUsernameAndSystemId()` – lookup during login
- `searchByUsernameExactMatch()` – used by local login to find the account
- `updateLastLogin()` / `updateLastTriedFailedLogin()` – audit trail
- `updateMyAccount()` – self-service password/email change
- `validatePassword()` – bcrypt comparison

### 8.5 Account API

📁 [account.controller.ts](../apps/server/src/modules/account/api/account.controller.ts)

The Account API is **admin-facing** (requires `ACCOUNT_VIEW` permission or Superhero role):

| Endpoint | Purpose |
|----------|---------|
| `GET /account?type=username&value=...` | Search accounts by username |
| `GET /account?type=userId&value=...` | Search accounts by user ID |
| `GET /account/:id` | Get specific account |
| `PATCH /account/me` | Self-service update (password, email, name) |
| `PATCH /account/:id` | Admin update (password, username, activation) |
| `DELETE /account/:id` | Admin delete |

### 8.6 Module Structure

```
account/
├── api/
│   ├── account.controller.ts      # REST controller
│   ├── account.uc.ts              # Use cases (search, update, delete)
│   ├── dto/                       # Request/response DTOs
│   └── mapper/                    # DTO ↔ domain mappers
├── domain/
│   ├── do/
│   │   ├── account.ts             # Account domain object
│   │   ├── account-save.ts        # Save DTO
│   │   ├── update-account.ts      # Admin update DTO
│   │   └── update-my-account.ts   # Self-service update DTO
│   ├── interface/
│   │   └── account.repo.interface.ts  # Repository interface
│   └── services/
│       ├── account.service.ts         # Public service (facade)
│       ├── account-db.service.ts      # DB implementation
│       └── account.service.abstract.ts # Abstract base
├── repo/
│   ├── account.entity.ts          # MikroORM entity
│   ├── account.repo.ts            # Repository implementation
│   └── mapper/                    # Entity ↔ domain mappers
├── saga/                          # User deletion saga step
├── account.module.ts              # Domain module
└── account-api.module.ts          # API module
```

---

## 9. User Module

### 9.1 User Entity (Legacy MikroORM Entity)

📁 [user.entity.ts](../apps/server/src/modules/user/repo/user.entity.ts)

The `User` entity is **one of the most connected entities** in the system:

```typescript
class User extends BaseEntityWithTimestamps {
    email: string
    firstName: string
    lastName: string
    preferredName?: string
    roles: Collection<Role>       // ManyToMany
    school: SchoolEntity          // ManyToOne
    secondarySchools: UserSchoolEmbeddable[]
    ldapDn?: string               // LDAP distinguished name
    externalId?: string           // External system user ID
    forcePasswordChange?: boolean
    lastLoginSystemChange?: Date
    outdatedSince?: Date
    source?: string               // Sync source identifier
    consent?: ConsentEntity
}
```

**Important for authentication:** `User.roles` determines the JWT payload's `roles[]`, and `User.externalId` + `User.ldapDn` are used for external system lookups.

### 9.2 UserDo (Domain Object)

📁 [user.do.ts](../apps/server/src/modules/user/domain/do/user.do.ts)

A clean domain representation used in newer code (OAuth provisioning, etc.). Contains the same fields but with `EntityId` references instead of entity relations.

### 9.3 User Service

📁 [user.service.ts](../apps/server/src/modules/user/domain/service/user.service.ts)

Key methods used by authentication:
- `getUserEntityWithRoles(userId)` – loads User with populated roles (used by Local and LDAP strategies)
- `findByExternalId(externalId, systemId)` – finds user by external system ID (used by OAuth and OIDC logout)
- `me(userId)` – returns user + resolved permissions

### 9.4 Module Structure

```
user/
├── api/
│   ├── user.controller.ts            # User API
│   ├── admin-api-user.controller.ts   # Admin user management
│   ├── user.uc.ts / admin-api-user.uc.ts
│   └── dto/ mapper/
├── domain/
│   ├── do/
│   │   └── user.do.ts                # UserDo domain object
│   ├── service/
│   │   ├── user.service.ts           # Core user service
│   │   └── user-authorizable.service.ts
│   ├── interface/                     # Repo interface
│   └── mapper/ query/ type/ events/
├── repo/
│   ├── user.entity.ts                # User MikroORM entity
│   ├── user.repo.ts                  # Legacy entity repo
│   ├── user-do.repo.ts              # DO-based repo
│   └── user-event-subscriber.ts
├── saga/                             # User deletion saga steps
├── user.module.ts                    # Module definition
├── user-api.module.ts                # API module
└── user-admin-api.module.ts          # Admin API module
```

---

## 10. OAuth Module

### 10.1 SVS as OAuth *Client* (Login via External IdP)

This is the primary OAuth use case: users log in via an external Identity Provider (like Moin.Schule or TSP).

📁 [oauth.module.ts](../apps/server/src/modules/oauth/oauth.module.ts)

**Core service:** `OAuthService`

📁 [oauth.service.ts](../apps/server/src/modules/oauth/service/oauth.service.ts)

| Method | Purpose |
|--------|---------|
| `authenticateUser(systemId, redirectUri, code)` | Exchange auth code for tokens, validate ID token |
| `provisionUser(systemId, idToken, accessToken)` | Create/update user via ProvisioningService |
| `requestToken(code, oauthConfig, redirectUri)` | Build and send token request to IdP |
| `validateToken(idToken, oauthConfig)` | Verify JWT signature against IdP's JWKS |
| `validateLogoutToken(logoutToken, oauthConfig)` | Validate OIDC backchannel logout token |

**OAuth flow steps (see [official docs](https://documentation.dbildungscloud.dev/docs/topics/oauth/concept)):**

```
1. Client → IdP:  User clicks "Login via XYZ", redirected to authorization endpoint
2. IdP → Client:  User authenticates, IdP redirects back with authorization code
3. Client → SVS:  POST /authentication/oauth2 { systemId, redirectUri, code }
4. SVS → IdP:     Token request (authorization code grant)
5. SVS ← IdP:     Receives { id_token, access_token, refresh_token }
6. SVS:           Validates id_token signature via JWKS
7. SVS:           Provisions user (create or update via ProvisioningService)
8. SVS:           Generates SVS JWT, adds to Valkey whitelist
9. SVS → Client:  Returns { accessToken: "svs-jwt", externalIdToken: "idp-id-token" }
```

### 10.2 OAuth Session Tokens

📁 [oauth-session-token.ts](../apps/server/src/modules/oauth/domain/do/oauth-session-token.ts)

When external system logout is enabled (`FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED`), the OAuth login flow saves the refresh token:

```typescript
class OauthSessionToken extends DomainObject<OauthSessionTokenProps> {
    userId: EntityId
    systemId: EntityId
    refreshToken: string
    expiresAt: Date
}
```

This is later used by `LogoutService.externalSystemLogout()` to call the IdP's `end_session_endpoint`.

### 10.3 OAuth Adapter Module

📁 [oauth-adapter.module.ts](../apps/server/src/modules/oauth-adapter/oauth-adapter.module.ts)

Handles the HTTP communication with external IdPs:
- `OauthAdapterService.sendTokenRequest()` – sends token exchange request
- `OauthAdapterService.getPublicKey()` – fetches JWKS for token validation

### 10.4 SVS as OAuth *Provider* (Hydra Integration)

📁 [oauth-provider.module.ts](../apps/server/src/modules/oauth-provider/oauth-provider.module.ts)

The SVS can also act as an **OAuth provider** itself (for external tools that want to authenticate SVS users). This is powered by [Ory Hydra](https://www.ory.sh/hydra/) and exposed at `/oauth2/...`.

**Controller:** [oauth-provider.controller.ts](../apps/server/src/modules/oauth-provider/api/oauth-provider.controller.ts)

| Flow | Endpoints |
|------|-----------|
| **Login flow** | `GET /oauth2/loginRequest/:challenge`, `PATCH /oauth2/loginRequest/:challenge` |
| **Consent flow** | `GET /oauth2/consentRequest/:challenge`, `PATCH /oauth2/consentRequest/:challenge` |
| **Logout flow** | `GET /oauth2/logoutRequest/:challenge`, `PATCH /oauth2/logoutRequest/:challenge` |
| **Client CRUD** | `GET/POST/PUT/DELETE /oauth2/clients/:id` |
| **Session management** | `GET/DELETE /oauth2/auth/sessions/consent` |

This is an advanced topic and primarily relevant for tool integrations, not for user-facing login.

---

## 11. Special Cases

### 11.1 Support User Impersonation (SHD)

When a support desk (SHD) user needs to impersonate a target user:

```typescript
AuthenticationService.generateSupportJwt(supportUser, targetUser)
```

This creates a JWT for the **target user** but with `support: true` and `supportUserId` set to the SHD user's ID. Uses a shorter lifetime (`JWT_LIFETIME_SUPPORT_SECONDS`, default 7 days).

### 11.2 Service Accounts

Service accounts authenticate via `POST /authentication/local-service-account` using the same Local strategy, but:
- The `User` must have `isServiceAccountUser() === true`
- A shorter JWT lifetime is used (`JWT_LIFETIME_SERVICE_ACCOUNT_SECONDS`, default 2 hours)
- The JWT payload has `isServiceAccount: true`
- Authentication is logged via `AuditLogger`

### 11.3 Brute Force Protection

📁 [authentication.service.ts](../apps/server/src/modules/authentication/services/authentication.service.ts)

```typescript
checkBrutForce(account: Account): void {
    if (account.lasttriedFailedLogin) {
        const timeDifference = (now - lasttriedFailedLogin) / 1000;
        if (timeDifference < LOGIN_BLOCK_TIME) {
            throw new BruteForceError(timeToWait);
        }
    }
}
```

After a failed login, `lasttriedFailedLogin` is updated. Any subsequent attempt within `LOGIN_BLOCK_TIME` (default 900 seconds / 15 minutes) is blocked.

---

## 12. Key Files Quick Reference

### Authentication Module

| Purpose | File |
|---------|------|
| Module entry point | [authentication.module.ts](../apps/server/src/modules/authentication/authentication.module.ts) |
| API module | [authentication-api.module.ts](../apps/server/src/modules/authentication/authentication-api.module.ts) |
| Login controller | [login.controller.ts](../apps/server/src/modules/authentication/controllers/login.controller.ts) |
| Logout controller | [logout.controller.ts](../apps/server/src/modules/authentication/controllers/logout.controller.ts) |
| Login use case | [login.uc.ts](../apps/server/src/modules/authentication/uc/login.uc.ts) |
| Logout use case | [logout.uc.ts](../apps/server/src/modules/authentication/uc/logout.uc.ts) |
| Authentication service | [authentication.service.ts](../apps/server/src/modules/authentication/services/authentication.service.ts) |
| Logout service | [logout.service.ts](../apps/server/src/modules/authentication/services/logout.service.ts) |
| LDAP service | [ldap.service.ts](../apps/server/src/modules/authentication/services/ldap.service.ts) |
| Local strategy | [local.strategy.ts](../apps/server/src/modules/authentication/strategy/local.strategy.ts) |
| LDAP strategy | [ldap.strategy.ts](../apps/server/src/modules/authentication/strategy/ldap.strategy.ts) |
| OAuth2 strategy | [oauth2.strategy.ts](../apps/server/src/modules/authentication/strategy/oauth2.strategy.ts) |
| Erwin strategy | [erwin.strategy.ts](../apps/server/src/modules/authentication/strategy/erwin.strategy.ts) |
| OAuth2 context helper | [oauth2-context.helper.ts](../apps/server/src/modules/authentication/helper/oauth2-context.helper.ts) |
| JWT whitelist adapter | [jwt-whitelist.adapter.ts](../apps/server/src/modules/authentication/helper/jwt-whitelist.adapter.ts) |
| CurrentUser mapper | [current-user.mapper.ts](../apps/server/src/modules/authentication/mapper/current-user.mapper.ts) |
| Configuration | [authentication-config.ts](../apps/server/src/modules/authentication/authentication-config.ts) |
| JWT config | [jwt-module.config.ts](../apps/server/src/modules/authentication/jwt-module.config.ts) |

### Auth Guard Infra

| Purpose | File |
|---------|------|
| Module | [auth-guard.module.ts](../apps/server/src/infra/auth-guard/auth-guard.module.ts) |
| JWT validation adapter | [jwt-validation.adapter.ts](../apps/server/src/infra/auth-guard/adapter/jwt-validation.adapter.ts) |
| JWT strategy | [jwt.strategy.ts](../apps/server/src/infra/auth-guard/strategy/jwt.strategy.ts) |
| WS-JWT strategy | [ws-jwt.strategy.ts](../apps/server/src/infra/auth-guard/strategy/ws-jwt.strategy.ts) |
| X-API-Key strategy | [x-api-key.strategy.ts](../apps/server/src/infra/auth-guard/strategy/x-api-key.strategy.ts) |
| Decorators | [jwt-auth.decorator.ts](../apps/server/src/infra/auth-guard/decorator/jwt-auth.decorator.ts) |
| ICurrentUser | [user.ts](../apps/server/src/infra/auth-guard/interface/user.ts) |
| JwtPayload | [jwt-payload.ts](../apps/server/src/infra/auth-guard/interface/jwt-payload.ts) |
| JwtPayloadBuilder | [jwt-payload.builder.ts](../apps/server/src/infra/auth-guard/mapper/jwt-payload.builder.ts) |
| CurrentUserBuilder | [current-user.factory.ts](../apps/server/src/infra/auth-guard/mapper/current-user.factory.ts) |

### Account Module

| Purpose | File |
|---------|------|
| Module | [account.module.ts](../apps/server/src/modules/account/account.module.ts) |
| API module | [account-api.module.ts](../apps/server/src/modules/account/account-api.module.ts) |
| Account domain object | [account.ts](../apps/server/src/modules/account/domain/do/account.ts) |
| Account service (public) | [account.service.ts](../apps/server/src/modules/account/domain/services/account.service.ts) |
| Account DB service | [account-db.service.ts](../apps/server/src/modules/account/domain/services/account-db.service.ts) |
| Account entity | [account.entity.ts](../apps/server/src/modules/account/repo/account.entity.ts) |
| Repo interface | [account.repo.interface.ts](../apps/server/src/modules/account/domain/interface/account.repo.interface.ts) |

### User Module

| Purpose | File |
|---------|------|
| Module | [user.module.ts](../apps/server/src/modules/user/user.module.ts) |
| User entity | [user.entity.ts](../apps/server/src/modules/user/repo/user.entity.ts) |
| UserDo | [user.do.ts](../apps/server/src/modules/user/domain/do/user.do.ts) |
| User service | [user.service.ts](../apps/server/src/modules/user/domain/service/user.service.ts) |

### OAuth Module

| Purpose | File |
|---------|------|
| Module | [oauth.module.ts](../apps/server/src/modules/oauth/oauth.module.ts) |
| OAuthService | [oauth.service.ts](../apps/server/src/modules/oauth/service/oauth.service.ts) |
| OAuth session token | [oauth-session-token.ts](../apps/server/src/modules/oauth/domain/do/oauth-session-token.ts) |
| OAuth controller | [oauth.controller.ts](../apps/server/src/modules/oauth/api/oauth.controller.ts) |

### Feathers Legacy

| Purpose | File |
|---------|------|
| Auth service setup | [src/services/authentication/index.js](../src/services/authentication/index.js) |
| JWT strategy | [src/services/authentication/strategies/JwtStrategy.js](../src/services/authentication/strategies/JwtStrategy.js) |
| Whitelist logic | [src/services/authentication/logic/whitelist.js](../src/services/authentication/logic/whitelist.js) |
| Auth hooks | [src/services/authentication/hooks/index.js](../src/services/authentication/hooks/index.js) |
| Configuration | [src/services/authentication/configuration.js](../src/services/authentication/configuration.js) |
| Feathers–NestJS bridge | [apps/server/src/imports-from-feathers.ts](../apps/server/src/imports-from-feathers.ts) |

---

## 13. Suggested Exploration Order

For hands-on exploration after this presentation:

1. **Start with the interfaces:** Read `ICurrentUser`, `JwtPayload`, `CreateJwtPayload` to understand what flows through the system
2. **Follow a local login:** Trace `POST /authentication/local` from `LoginController` → `LocalStrategy.validate()` → `AuthenticationService.generateJwtAndAddToWhitelist()` → Valkey
3. **Follow a request validation:** Pick any `@JwtAuthentication()` endpoint and trace through `JwtAuthGuard` → `JwtStrategy.validate()` → `JwtValidationAdapter.isWhitelisted()` → Feathers whitelist code
4. **Understand Account ↔ User:** Read `Account` domain object, then `User` entity, and trace how they connect during login
5. **Follow an OAuth2 login:** Trace `POST /authentication/oauth2` through `Oauth2Strategy` → `Oauth2ContextHelper` → `OAuthService.authenticateUser()` → `OAuthService.provisionUser()`
6. **Study logout flows:** Compare the three logout endpoints and their different scopes (single session, all sessions, external system)
7. **Explore the Feathers bridge:** Read `imports-from-feathers.ts` and trace how `ensureTokenIsWhitelisted` is shared

---

*Document prepared for technical handover, June 2026*
