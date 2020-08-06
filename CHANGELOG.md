# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## Unreleased
### Changed
## [23.6.3] - 2020-07-28

### Added

- SC-5754 Added isExternal attribute to school model. If ldapSchoolIdentifier or source is defined, isExternal will be set to true
otherwise, if none of them are defined it wil be set to false.

### Changed

- SC-4289 Changed aggregations in admin tables, classes are now taken only from current year or max grade level, and are sorted
by numeric ordering.

### Added

- SC-4520 created a new Service called Activation Service; with which jobs can be defined and are 
only executed when an activation link (activation code) is confirmed (e.g.: change of e-mail address/username)
Also added a sub-service for changing email/username in Activation Service

### Fixed

- SC-5250: Fixes the CSV-Import, if there are whitespaces in the columnnames
- SC-5686: only users with the team permission "RENAME_TEAM" can execute the patch method in teams route

### Changed

- SC-5542: Added an after hook for AdminUsers find method which formats birthday date to DD.MM.YYYY format.

### Security

## [23.6.3] - 2020-07-28

### Fixed - 23.6.3
- SC-5416: Enable maintenance Mode for LDAP Schools and change the currentSchoolYear for non-LDAP Schools


## [23.6.2] - 2020-07-22

### Fixed - 23.6.2

- SC-5773: LDAPSchoolSyncer now correctly populates classes synced from an LDAP server, even if only students or only teachers are assigned to the class.
- SC-5250: Fixes the CSV-Import, if there are whitespaces in the columnnames

## [23.6.1] - 2020-07-22

### Fixed - 23.6.1

- SC-5733: LDAPSchoolSyncer now uses the Users model service to avoid ignoring indexes due to automatic collation


## [23.6.0] - 2020-07-21

### Added - 23.6.0

- SC-4142: Added indexes on TSP sync related attributes in user and school schema.
- SC-4142: Adds info about unchanged entities to TSP sync statistics

## [23.5.4] - 2020-07-08

### Added - 23.5.4

- SC-2714 Added the federal state "Internationale Schule"


## [23.5.0] - 2020-06-15

### Added in 23.5.0

- SC-4192 add tests that ensure classes on other schools cant be manipulated


### Fixed in 23.5.0

### Changed in 23.5.0

- SC-4957 user.ldapId and user.ldapDn are now indexed to improve performance


## [23.4.7] - 2020-07-01

### Fixed in 23.4.7

- SC-4965 Converted "consent" subdocument in "users" to a nested document to fix changing consents in administration and removing a bug in registration that resulted in deleted users.

## [23.4.5] - 2020-06-17

### Fixed in 23.4.5

- SC-5007 re-introduces ldap system root path to API result to fix issue with duplicating schools


## [23.4.3-nbc] - 2020-06-15

### Fixed in 23.4.3-nbc

- SC-5054 Revert hook restrictions that prevented registration with custom deata privacy documents enabled


## [23.4.0-nbc] - 2020-06-11

### Added - 23.4.0-nbc

- SC-4577 extend consentversions with school specific privacy policy, which can be added by the school admin


## [23.2.4] - 2020-06-05

### Fixed - 23.2.4

- SC-4876 soften sanitization to allow editor actions to be persisted correctly

## [23.2.1] - 2020-06-04

### Security - 23.2.1

- SC-4720 improve importhashes for registrationlinks

## [23.2.0] - 2020-06-03

### Security - 23.2.0

- SC-4506 Secure Find User Route. Access user list by students is allowed only if they are eligible to create teams.
- SC-4506 Secure Get User Route. Read user details may only users with STUDENT_LIST or TEACHER_LIST permissions

## [23.1.4] - 2020-05-29

### Fixed in 23.1.4

- SC-4749 avoid xss in image onerror event attribute for submissions

## [23.0.0] - 2020-05-19

### Changed in 23.0.0

- SC-4075 Teams creation by students logic was changed. New environment enumeration variable `STUDENT_TEAM_CREATION` 
with possible values `disabled`, `enabled`, `opt-in`, `opt-out` was introduced. The feature value is set by instance deployment. 
In case of `disabled`, `enabled` it is valid for all schools of the instance and cannot be changed by the admin. 
In case of `opt-in` and `opt-out` the feature should be enabled/disabled by the school admin.

## [22.10.3] - 2020-05-13

### Fixed in 22.10.3

-   Unbind errors no longer stop the LDAP sync if more systems follow

## [22.10.2] - 2020-05-12

### Fixed in 22.10.2

-   fixed pagination for students/teacher table

## [22.10.0] - 2020-05-11

### Added in 22.10.0

-   SC-3719 Files now have a `creator` attribute that references the ID of the user that created the file.
    For old files, it is set to the first user permission inside the permissions array (legacy creator check).
-   SC-3719 The `files` collection now has two additional indexes: `{creator}` and `{permissions.refId, permissions.refPermModel}`.
-   add MongoDB Collation Support to control sorting behaviour in regards to capitalization.
-   SC-3607 CSVSyncer now allows the optional birthday field (formats: dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy) in CSV data
-   SC-3948 support users query in adminusers routes
-   SC-4018 Add additional nexboard permissions
-   SC-4008 Migrated generateRegistrationLink Hook from SC-Client into Server
-   SC-3686 Added new Registration Link Service for sending mails
-   SC-4094 Teachers can now provide feedback in the form of uploaded files

### Fixed in 22.10.0

-   SC-3892 Update Filter of submission in order to work with older submissions
-   SC-3395 if fetching the release fails, a error will be thrown
-   backup.js now outputs valid json exports
-   SC-4105 fixed a problem with new users tests not working with recent hotfix.
-   Checks of user consent calculated correct now

### Changed in 22.10.0

-   User delete now accepts bulk delete requests
-   SC-3909 Teachers no longer have the permission to create or delete users
-   SC-3958: the "general" LDAP strategy now returns an empty array if classes are not configured properly
-   Increase performance - error logging in sentry
-   Mergify: add and modified some configs

### Removed in 22.10.0

-   SC-3958: the LDAP strategy interface no longer supports synchronizing team members to the never-used original N21-IDM
-   SC-3958: the environment variables NBC_IMPORTURL, NBC_IMPORTUSER, and NBC_IMPORTPASSWORD are no longer used and have been removed
-   Removed the obsolete commentSchema from the homework service. It was not in use.

## [22.9.20]

### Added

-  SC-4042: Added support for a central IServ-Connector

### Changed

-  LDAP syncs on servers with multiple schools now only sync one school at a time to avoid issues when paging search requests
-  LDAP syncs use less memory (because they do a lot less in parallel)
-  LDAPSchoolSyncer now returns user and class statistics

### Fixed

-  Fixed LDAP-Service disconnect method
-  LDAPSystemSyncers now properly close their connections after syncing
-  Authentication via LDAP now tries to close the connection after login
-  Fixed a warning message appearing when patching users via internal request

## [22.9.18]

### Fixed

-  SC-4215: Do not allow unprivileged users to find users with non-school roles (expert, parent, etc.)

## [22.9.17]

### Fixed

-  SC-4121: File uploads no longer fail if the security scan is misconfigured or errors during enqueuing

## [22.9.10]

### Added

-  enable API key for /mails route

## [22.9.10]

### Fixed

-  fixed an issue that prevented api-key authenticated calls to function with query.

## [22.9.9]

### Added

-  Sync can now be authenticated with an api-key.

## [22.9.8]

### Fixed

-  Fixed an error where ldap users without proper uuid where not filtered correctly.

## [22.9.7]

### Security

-  the /ldap route can now only be triggered for the users own school.

## [22.9.6]

### Added

-   users without `SCHOOL_EDIT` permission, but with `SCHOOL_STUDENT_TEAM_MANAGE` permission can now toggle the school feature `disableStudentTeamCreation`.

### Fixed

-   Admins in Thuringia can now prevent students from creating teams


## [22.9.5]

### Security

-   increased security for the publicTeachers route.

## [22.9.4]

### Fixed

-   fixes an issue with LDAP account updates if more than one account exists for the user (migration from local login to LDAP)


## [22.9.3]

### Fixed

-   fixes regression in LDAP sync, that caused incomplete user updates


## [22.9.2]

### Security

-   increased security for user PUT operation

## [22.9.1]

### Fixed

-   SC-3994: remove unnecessary bucket creation call that caused school administration and LDAP Sync to throw errors

### Changed
-   use collation for /homeworks, /users, /publicTeachers, /users/admin/teachers, /users/admin/students, /classes, and /courses.

## [22.9.0]

-   Security updates

## [22.8.0]

### Added

- This changelog has been added

### Removed

-   Clipboard sockets
-   This changelog has been added
-   Backend route to confirm analog consents in bulk
-   Changed Seed Data + Migration Script: Added feature flag for new Editor to klara.fall@schul-cloud.org
-   SC-2922: Enable use of multiple S3 instances as file storage provider
    -   A new collection is added to administrate multiple S3 instances
    -   A migration will automatically use the AWS environment variables to add those as default provider for all existing schools
    -   For new schools the less used provider is assigned as storage provider
    -   Environment Variables:
        -   FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED=true will activate the feature
        -   S3_KEY, used for symmetric encryption, already required for the migration because of the secret access key encryption

### Changed

-   SC-3767: moved env variables to globals.js, NODE_ENV required to equal 'test' for test execution and right database selection

### Changed

-   migrated backup.sh script to node, so it can run platform independant and works on windows.

### Fixed

-   SC-3821: Fix Co-Teachers and Substitution teachers not being able to Grade Homeworks


## 22.7.1

### Fixed

- Admin and teacher user could change other users without changing them self
