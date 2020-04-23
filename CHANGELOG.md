# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## Unreleased

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


## [22.9.0]

-   Security updates

## [22.8.0]

### Added

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

### Fixed

-   SC-3821: Fix Co-Teachers and Substitution teachers not being able to Grade Homeworks


## 22.7.1

### Fixed

- Admin and teacher user could change other users without changing them self
