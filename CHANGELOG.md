# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## Unreleased

### Added

-   SC-3719 Files now have a `creator` attribute that references the ID of the user that created the file.
    For old files, it is set to the first user permission inside the permissions array (legacy creator check).
-   SC-3719 The `files` collection now has two additional indexes: `{creator}` and `{permissions.refId, permissions.refPermModel}`.
-   add MongoDB Collation Support to control sorting behaviour in regards to capitalization.
-   SC-3607 CSVSyncer now allows the optional birthday field (formats: dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy) in CSV data
-   SC-3948 support users query in adminusers routes
-   SC-4018 Add additional nexboard permissions
-   SC-4008 Migrated generateRegistrationLink Hook from SC-Client into Server
-   SC-3686 Added new Registration Link Service for sending mails

### Fixed

-   SC-3892 Update Filter of submission in order to work with older submissions
-   SC-3395 if fetching the release fails, a error will be thrown
-   backup.js now outputs valid json exports
-   SC-4105 fixed a problem with new users tests not working with recent hotfix.

### Changed

-   User delete now accepts bulk delete requests
-   SC-3909 Teachers no longer have the permission to create or delete users
-   SC-3958: the "general" LDAP strategy now returns an empty array if classes are not configured properly
-   Increase performance - error logging in sentry

### Removed

-   SC-3958: the LDAP strategy interface no longer supports synchronizing team members to the never-used original N21-IDM
-   SC-3958: the environment variables NBC_IMPORTURL, NBC_IMPORTUSER, and NBC_IMPORTPASSWORD are no longer used and have been removed
-   Removed the obsolete commentSchema from the homework service. It was not in use.

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

-   admins in Thuringia can now prevent students from creating teams


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
