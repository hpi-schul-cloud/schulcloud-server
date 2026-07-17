# Technical Handover: Consent & FirstLogin & Registration

## Document Purpose & Structure

This document provides an overview of the consent model and the `firstLogin` flow. These are primarily relevant for **locally registered users** (i.e., users created via the `/registration` endpoint rather than provisioned through an IDM sync). Since nearly all users are now managed via external IDMs (TSP, Schulconnex, LDAP), this topic is mostly historical context — but understanding it is useful in case edge cases arise or a NestJS re-implementation is needed (for example when a new state is introduced).

**Prerequisites:** Familiarity with the general architecture (NestJS app + Feathers legacy app). The [sync-flows handover](./sync-flows-handover.md) explains how IDM-provisioned users bypass consent.

---

## 1. Overview: When Does Consent Matter?

### 1.1 The Core Question

Before a user can fully use the platform, they (or their parents) must accept privacy and terms-of-use consent. The question is: **who provides that consent, and when?**

| User Origin | Consent Handling |
|-------------|-----------------|
| **TSP sync** (batch or login) | Auto-created by `TspProvisioningService` — user never sees a consent screen |
| **Schulconnex / Moin.Schule** (login) | Auto-created by NestJS `RegistrationService` — user never sees a consent screen |
| **LDAP sync** | No consent created during sync. If `SKIP_CONDITIONS_CONSENT` includes the user's role, consent is auto-granted on first login. Otherwise, the user goes through the `firstLogin` flow. |
| **Local registration** (Feathers `/registration`) | Consent is collected during the registration form and stored immediately |
| **NestJS registration** (`/registration` API) | Consent is auto-created by the NestJS `RegistrationService` |

### 1.2 Key Insight

The `firstLogin` Feathers service is essentially a **post-registration completion step**. It handles:
1. Forcing a password change (if `forcePasswordChange` is set on the user)
2. Collecting the user's birthdate (for students)
3. Collecting consent (privacy + terms of use) from the user or their parents
4. Accepting updated consent versions (if consent documents have been revised)

A user only hits this flow if they **don't already have valid consent** and haven't completed first login (`preferences.firstLogin !== true`).

### 1.3 The `SKIP_CONDITIONS_CONSENT` Bypass

The config value `SKIP_CONDITIONS_CONSENT` (string, e.g. `"employee"` or `"student employee"`) determines which roles get **automatic consent** during `firstLogin` without needing to manually accept:

- `"employee"` → teachers and administrators get auto-consent
- `"student"` → students get auto-consent

When a role is covered by this config, the `firstLogin` service generates a digital consent object automatically instead of requiring user interaction.

It is currently set to `"student employee"` in both BRB and NBC

---

## 2. The Consent Data Model

### 2.1 Where Consent Lives

Consent is stored as an **embedded subdocument** on the User model (MongoDB), not as a separate collection.

📁 [user.schema.js](../src/services/user/model/user.schema.js) (Feathers)
📁 [consent.ts](../apps/server/src/modules/user/domain/do/consent.ts) (NestJS domain object)

```javascript
// In the user schema (Feathers/MongoDB):
consent: {
    userConsent: {
        form: String,              // 'analog' | 'digital' | 'update'
        dateOfPrivacyConsent: Date,
        dateOfTermsOfUseConsent: Date,
        privacyConsent: Boolean,
        termsOfUseConsent: Boolean,
    },
    parentConsents: [{
        form: String,
        dateOfPrivacyConsent: Date,
        dateOfTermsOfUseConsent: Date,
        privacyConsent: Boolean,
        termsOfUseConsent: Boolean,
    }],
    consentVersionUpdated: String,  // 'all' | 'dateOfPrivacyConsent' | 'dateOfTermsOfUseConsent'
}
```

### 2.2 Age-Based Consent Rules

Two config values control who needs to consent:

| Config | Default | Meaning |
|--------|---------|---------|
| `CONSENT_AGE_FIRST` | `14` | Below this age: only parent consent required |
| `CONSENT_AGE_SECOND` | `16` | At or above this age: only user consent required |
| Between 14–15 | — | Both parent AND user consent required |

This logic is implemented in:
📁 [src/services/consent/utils/consent.js](../src/services/consent/utils/consent.js) → `defineConsentStatus(birthday, consent)`

### 2.3 Consent Status

The `defineConsentStatus()` function computes a status string:

| Status | Meaning |
|--------|---------|
| `'ok'` | All required consents are present |
| `'missing'` | Required consents are not yet given |
| `'parentsAgreed'` | Parent consented, but user (14–15) hasn't yet |
| `'unknown'` | No birthday set (non-student), no user consent |

### 2.4 NestJS Domain Objects

The NestJS side mirrors the same structure as simple value objects:

| File | Class |
|------|-------|
| [consent.ts](../apps/server/src/modules/user/domain/do/consent.ts) | `Consent` (container with `userConsent?` + `parentConsents?`) |
| [user-consent.ts](../apps/server/src/modules/user/domain/do/user-consent.ts) | `UserConsent` (form, privacyConsent, termsOfUseConsent, dates) |
| [parent-consent.ts](../apps/server/src/modules/user/domain/do/parent-consent.ts) | `ParentConsent` (same shape as UserConsent) |

These are used by the NestJS `RegistrationService` and `AccountService` but have no independent business logic.

### 2.5 Admin Consent Management

School administrators can update a user's consent via a dedicated Feathers endpoint:

📁 [src/services/consent/services/consentsUpdate.js](../src/services/consent/services/consentsUpdate.js)

**Endpoint:** `PATCH /consents/:userId`

This patches the consent object directly onto the user document. It requires `STUDENT_EDIT` or `STUDENT_LIST` permissions. This was used by the admin UI to set consent on behalf of students (e.g., when paper consent forms were collected).

---

## 3. The Registration Flow (Feathers)

### 3.1 Overview

📁 [src/services/user/registration.js](../src/services/user/registration.js)

The Feathers `/registration` endpoint handles self-registration of students (and sometimes teachers) via an import hash link. This is the "classic" registration where users arrive via an invitation link.

### 3.2 Flow

```
POST /registration
    │
    ├─► 1. Resolve classOrSchoolId → find class or school
    │
    ├─► 2. Populate user from data + validate importHash
    │      (importHash must match an existing user stub)
    │
    ├─► 3. Validate:
    │      ├─► Role is allowed to login
    │      ├─► Student age checks (parent required if under CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS)
    │      ├─► Parent email ≠ student email
    │      └─► Password match
    │
    ├─► 4. Verify registration PIN (email verification)
    │
    ├─► 5. Create/update user in DB
    │
    ├─► 6. Create account (via nest-account-uc)
    │
    ├─► 7. Store consent:
    │      ├─► If parent_email → store as parentConsent
    │      └─► Else → store as userConsent
    │
    └─► 8. Return { user, account, consent }
        (On any error: rollback user + account + consent)
```

### 3.3 Key Points

- **Import hash required:** Registration only works for users that were pre-created with an `importHash` (e.g., by an admin importing a class list).
- **Registration PIN:** Email verification is done via a PIN sent to the user's (or parent's) email.
- **Consent is stored immediately** during registration — the user (or parent) provides it in the registration form.
- **Rollback on failure:** If any step fails, previously created user/account/consent records are deleted.

---

## 4. The `firstLogin` Service (Feathers)

### 4.1 What It Does

📁 [src/services/user/firstLogin.js](../src/services/user/firstLogin.js)

The `firstLogin` service is a Feathers service at `/firstLogin` that accepts a `POST` (create). It is called by the frontend after a user's first successful authentication when they need to complete their profile.

### 4.2 Flow

```
POST /firstLogin (authenticated, JWT required)
    │
    ├─► 1. Load user + roles
    │
    ├─► 2. Set preferences.firstLogin = true
    │      Set forcePasswordChange = false
    │
    ├─► 3. If password provided:
    │      → Call nest-account-uc.replaceMyTemporaryPassword()
    │
    ├─► 4. Validate/set student birthdate
    │
    ├─► 5. Patch user (preferences, birthday, forcePasswordChange)
    │
    ├─► 6. Handle consent:
    │      ├─► If SKIP_CONDITIONS_CONSENT matches role → auto-consent
    │      ├─► If user consent data provided → store userConsent
    │      ├─► If parent consent data provided → store parentConsents
    │      └─► If consent version update → update existing consent dates
    │
    └─► Return
```

### 4.3 Key Behaviors

- **Password change:** Delegates to the NestJS `AccountService.replaceMyTemporaryPassword()` which validates that either `forcePasswordChange` is true or `preferences.firstLogin` is false.
- **Consent skip:** The `SKIP_CONDITIONS_CONSENT` config can auto-grant consent for certain roles without user interaction.
- **Consent version updates:** If `termsOfUseConsentVersion` or `privacyConsentVersion` are passed, the service updates the dates on the existing consent record (used when consent documents are revised and users must re-accept).
- **Hooks:** Only `create` is allowed externally; all other methods are disabled. Requires JWT authentication.

📁 [src/services/user/hooks/firstLogin.js](../src/services/user/hooks/firstLogin.js)

---

## 5. The NestJS Registration Module

### 5.1 Overview

📁 [apps/server/src/modules/registration/](../apps/server/src/modules/registration/)

The NestJS `RegistrationModule` is a **separate, newer registration flow** designed for "external persons" (guests invited to rooms). It is NOT a 1:1 replacement of the Feathers registration.

### 5.2 Key Differences from Feathers Registration

| Aspect | Feathers `/registration` | NestJS Registration |
|--------|-------------------------|-------------------|
| Target users | Students/teachers via import hash | External persons invited to rooms |
| Consent | Collected from user in form | Auto-created (always granted) |
| `firstLogin` needed? | Yes (password change, additional consent) | No (`preferences.firstLogin` set to `false`) |
| Birthday | Collected from user | Hardcoded to `2000-01-01` (avoids parental consent dialog) |
| Invitation mechanism | Import hash + PIN | Registration secret (UUID) via email |

📁 [registration.service.ts](../apps/server/src/modules/registration/domain/service/registration.service.ts)

The NestJS registration auto-creates consent with:
```typescript
private createUserConsent(): Consent {
    // Creates a Consent with userConsent = { form: 'digital', all flags true, dates = now }
}
```

---

## 6. The Consent Service (Feathers)

### 6.1 Overview

📁 [src/services/consent/index.js](../src/services/consent/index.js)

The `/consents` Feathers service is a **deprecated adapter** that reads/writes consent data from the user model's embedded `consent` field. It presents the data as if it were a separate entity (for backwards compatibility with the frontend).

### 6.2 Services

| Route | Service | Purpose |
|-------|---------|---------|
| `/consents` | `ConsentService` (deprecated) | CRUD for user consent (reads from user model) |
| `/consents/:userId/check` | `ConsentCheckService` | Checks if consent is current or needs updating |
| `/consentVersions` | `ConsentVersionService` | Manages versioned consent documents |

### 6.3 ConsentCheck — Version Awareness

📁 [src/services/consent/services/consentCheck.service.js](../src/services/consent/services/consentCheck.service.js)

The `ConsentCheckService` checks whether new consent versions have been published since the user last consented. If so, it returns `haveBeenUpdated: true`, which triggers the frontend to show a re-consent dialog via `firstLogin`.

### 6.4 ConsentVersions

📁 [src/services/consent/model.js](../src/services/consent/model.js) — `ConsentVersionModel`
📁 [src/services/consent/services/consentVersionService.js](../src/services/consent/services/consentVersionService.js)

Consent versions allow publishing updated privacy/terms documents with a `publishedAt` date. The system can detect when a user's consent predates the latest version.

---

## 7. How IDM Syncs Bypass Consent

For reference (detailed in [sync-flows-handover](./sync-flows-handover.md)):

| IDM | How consent is handled |
|-----|----------------------|
| **TSP** | `TspProvisioningService` auto-creates `userConsent` + `parentConsents` with all flags `true` and `source: 'automatic-consent'` |
| **Schulconnex** | NestJS `RegistrationService.createUserConsent()` creates full digital consent automatically |
| **LDAP** | No consent created during sync. Relies on `SKIP_CONDITIONS_CONSENT` config or manual `firstLogin` flow |

---

## 8. The AccountService Connection (NestJS)

📁 [apps/server/src/modules/account/domain/services/account.service.ts](../apps/server/src/modules/account/domain/services/account.service.ts)

The NestJS `AccountService.replaceMyTemporaryPassword()` method is called by the Feathers `firstLogin` service. It only allows password replacement if:
- `user.forcePasswordChange === true`, OR
- `user.preferences.firstLogin === false` (first login hasn't been completed yet)

This is the bridge between the Feathers `firstLogin` flow and the NestJS account management.

---

## 9. Configuration Reference

| Config Key | Default | Purpose |
|-----------|---------|---------|
| `CONSENT_AGE_FIRST` | `14` | Age at which user's own consent becomes required |
| `CONSENT_AGE_SECOND` | `16` | Age at which parent consent is no longer required |
| `SKIP_CONDITIONS_CONSENT` | `""` | Roles that get auto-consent (e.g., `"employee"`, `"student"`, `"employee,student"`) |
| `CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS` | (see schema) | Min age for student self-registration without parent |

---

## 10. Directory Structure & Key Files

```
src/services/user/
├── firstLogin.js                  # FirstLogin service (consent + password + birthday)
├── registration.js                # Legacy registration (import hash + PIN)
├── hooks/
│   ├── firstLogin.js              # Hooks (auth only)
│   ├── consent.js                 # Consent-related hooks
│   └── registrationPins.js        # PIN verification hooks
├── model/
│   └── user.schema.js             # User schema with embedded consent

src/services/consent/
├── index.js                       # Service registration
├── model.js                       # ConsentVersion model
├── hooks/
│   ├── consents.js                # Access control
│   └── consentversionsModelHooks.js
├── services/
│   ├── consent.deprecated.js      # Consent CRUD (reads from user model)
│   ├── consentCheck.service.js    # Version check service
│   └── consentVersionService.js   # Consent document versioning
└── utils/
    └── consent.js                 # defineConsentStatus(), isParentConsentRequired()

apps/server/src/modules/user/domain/do/
├── consent.ts                     # NestJS Consent domain object
├── user-consent.ts                # NestJS UserConsent value object
└── parent-consent.ts              # NestJS ParentConsent value object

apps/server/src/modules/registration/
├── registration.module.ts         # NestJS registration module (external persons)
├── domain/service/
│   └── registration.service.ts    # Auto-creates consent for external persons
└── api/
    └── registration.controller.ts # REST API
```

---

## 11. Gotchas & Edge Cases

| Issue | Details |
|-------|---------|
| **Consent lives on user model** | Despite the `/consents` endpoint, consent is an embedded subdocument on the user — not a separate collection. The service is an adapter. |
| **firstLogin is a misnomer** | It doesn't run on first login — it runs when the frontend detects the user needs to complete profile/consent (checked via `preferences.firstLogin` and consent status). |
| **LDAP users without SKIP_CONDITIONS_CONSENT** | These users will hit the `firstLogin` flow on their first platform login. This is the main remaining scenario where `firstLogin` is relevant. |
| **Birthday hardcoding** | The NestJS registration hardcodes birthday to `2000-01-01` specifically to avoid triggering the parental consent age check. |
| **Rollback in registration** | The Feathers registration has manual rollback logic — if consent creation fails, it deletes the user and account. |
| **No deletion of consent** | There's no mechanism to revoke consent. The `remove` method on the consent service does `$unset: 'consent'` but has a typo (`'constent'`). |

---

## 12. Suggested Exploration Order

1. **Read the consent utils:** `src/services/consent/utils/consent.js` — understand `defineConsentStatus()` and the age-based rules
2. **Read the user schema:** `src/services/user/model/user.schema.js` — see the embedded consent structure
3. **Trace a registration:** `src/services/user/registration.js` — see how consent is collected during sign-up
4. **Trace a firstLogin call:** `src/services/user/firstLogin.js` — follow the logic for password, birthday, and consent handling
5. **Check the NestJS domain objects:** `apps/server/src/modules/user/domain/do/consent.ts` — see the type-safe representation
6. **Glance at ConsentCheck:** `src/services/consent/services/consentCheck.service.js` — understand the version-checking mechanism
7. **Reference:** See how TSP auto-creates consent in the [sync-flows-handover](./sync-flows-handover.md) §4.6

---

*Document prepared for technical handover, July 2026*
