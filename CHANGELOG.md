# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## [Unreleased]

### Added

- SC-7049 - Added unit tests for Merlin Service
- SC-7157 - add feature flag for Merlin feature with fallback
- SC-6567 - add new application errros
- SC-6766 - Added ESLint rules with Promise rules
- SC-6830 - Added hook to parse request to arrays when > 20 users are requested in adminUsers service
- SC-6769 - Introduce API validation module
- SC-6769 - API validation for users/admin routes
- SC-6510 - Added Merlin Url Generator for Lern Store / Edu-sharing

### Removed

### Changed

- SC-6567 - clean up error pipline
- SC-6510, fix a minor syntax error when exporting module
- Update commons to 1.2.7: print configuration on startup, introduce hierarchical configuration file setup
- Support asynchronous calls during server startup

### Fixed

- fixed README badges

## [25.1.0] - 2020-10-12

### Removed - 25.1.0

- SC-6784 - Removed duplicated birth date formatting code in adminUsers service, which was causing an "Invalid date" output
- SC-6743 - Removed usersForConsent related things in adminUsers service because the client does not send that parameter anymore
- SC-6506 - Remove dependecy to feathers-swagger in routes.test.js

### Changed - 25.1.0

- SC-6774 remove no-await-in-loop from eslint exceptions
- Rename statistic mails route, secure it over sync api key now
- SC-6809 - Maintain RabbitMQ connection and channels
- SC-5230 - Unblock Account-Page in Nuxt (securing /accounts and /users routes)

### Security - 25.1.0

- Added hotfix merges

## [25.0.12] - 2020-10-12

### Fixed

- SC-6676 allows only following roles for registration: teacher/student…

## [25.0.11] - 2020-10-07

### Fixed

- SC-7180 homework create now validates data properly

## [25.0.10] - 2020-10-07

### Added

- configured prometheus metrics - bucket sizes
- SC-6766 log unhandledRejection and unhandledException

## [25.0.9] - 2020-10-07

### Added

- SC-7115 - Reduce mongoose DB role request by enabling minor caching

## [25.0.8] - 2020-10-06

### Fixed

- SC-6676 - Registration: User with role parent should not be able to log-in
- SC-6960 - instead of deleting and recreating users during the rollback of a failed registration, use replace if necessary
- SC-6960 - properly raise exceptions during the registration process

## [25.0.7] - 2020-10-01

### Removed

- OPS-1316 - removed custom keep-alive header creation in express middleware

## [25.0.6] - 2020-10-01

### Added

- OPS-1316 - add indexes for slow files and submission queries

## [25.0.5] - 2020-10-01

### Added

- SC-6973 - add time window for pin creation

## [25.0.4] - 2020-09-30

### Added

- Added lead time detection

## [25.0.3]

### Added

- SC-6942 - add parse method to TSP strategy to declare it can handle the request and to keep authentication params clean

### Fixed

- SC-6942 - don't override payload defined by authentication method
- SC-6942 - don't search for account to populate if no username is given in `injectUsername`

## [25.0.2]

### Changed

- send mail for registration pin after add pin to db

## [25.0.1]

### Fixed

- SC-6696 - Fixed query used to determine course membership when checking permissions for course group lessons

## [25.0.0]

### Changed

- Extend JWT payload by schoolId and roleIds

## [24.5.1] - 2020-09-16

### Secrutiy

- Secure admin routes (update, patch, create)

## [24.5.0] - 2020-09-14

- SC-6674 Added checks to ensure unique emails
- Ignore database seed data with prettier, eslint, and codacy
- SC-6640 - Fixed email check within registration (case insensitive)

### Added - 24.5.0

- Test changelog has been updated for feature or hotfix branches
- SC-5612 - Adding search feature to the admintables for nuxt-client.

## [24.4.6] - 2020-09-11

### Changed

- SC-6733: central personal data does not get updated via CSV import

## [24.4.5] - 2020-09-10

### Fixed in 24.4.5

- SC-6637: generate QR codes for consent print sheets if group size exceeds 20

## [24.4.4] - 2020-09-08

### Fixed in 24.4.4]

- SC-6697: updates/sync account username when user is updated

## [24.4.3] - 2020-09-09

### Fixed in 24.4.3

- SC-6533 - Login not possible if admin reset password

## [24.4.2] - 2020-08-31

### Fixed in 24.4.2

- SC-6554: CSV-Importer no longer allows patching users with different roles

## [24.4.1] - 2020-08-31

### Fixed in 24.4.1

- SC-6511 - LDAP edit button missing.

### Changed in 24.4.1

- SC-5987 Internationalisation: extend user and school model with default language

### Added 24.4.1

- SC-6172: added hooks and checks to look for unique and not disposable emails in adminUsers service

## [24.4.0] - 2020-8-31

### Fixed in 24.4.0

- SC-6122 - Edusharing preload thumbnails in parallel. Edusharing authentication stabilisation.

## [24.3.3] - 2020-08-28

- SC-6469: prevent admin access to lessons admins shouldnt have access to.

## [24.3.2] - 2020-08-26

- SC-6382: fix handling of consents for users with unknown birthdays. consentStatus: 'ok' will be returned for valid consents without birthday.

## [24.3.1] - 2020-08-25

- SC-5420: TSC Schuljahreswechsel

## [24.3.0] - 2020-08-25

## [24.2.5] - 2020-08-24

- SC-6328 add migration to set student_list settings in all non n21 clouds schools to false.

## [24.2.4] - 2020-08-20

## [24.2.3] - 2020-08-20

## [24.2.2] - 2020-08-20

### Added in 24.2.2

- SC-5280: the LDAP service will try to reconnect up to three times if the connection was lost or could not be established
- SC-5280: the LDAP service and LDAP syncers now report more errors to the stats object
- SC-5808: added an isExternal check to the create method of AdminUsers service, only users from not external schools can create users

### Fixed in 24.2.2

- SC-5280: the LDAP sync now handles (timeout/firewall) errors much more gracefully
- SC-5280: LDAP bind operations will only be issued if the connection was established successfully
- SC-5280: aggregated LDAP statistics will now show the number of succesful and failed sub-syncs instead of just 1 or 0

### Changed in 24.2.2

- SC-5280: if disconnected prematurely, the LDAP service will not try to connect again just to unbind from the server

## [24.0.2] - 2020-08-05

### Fixed in 24.0.2

- SC-5835: Starting the new school year automatically - Cluster 4

## [24.0.1] - 2020-07-31

### Fixed in 24.0.1

- SC-5917 Fix activation of LDAP system

## [23.6.4] - 2020-07-29

### Fixed in 23.6.4

- SC-5883: Choose current schoolyear based on the school instead of the date for creating classes.

## [23.6.3] - 2020-07-28

### Added in 23.6.3

- SC-5754 Added isExternal attribute to school model. If ldapSchoolIdentifier or source is defined, isExternal will be set to true
  otherwise, if none of them are defined it wil be set to false.
- SC-4520 created a new Service called Activation Service; with which jobs can be defined and are
  only executed when an activation link (activation code) is confirmed (e.g.: change of e-mail address/username)
  Also added a sub-service for changing email/username in Activation Service
- SC-5280: the LDAP service will try to reconnect up to three times if the connection was lost or could not be established
- SC-5280: the LDAP service and LDAP syncers now report more errors to the stats object

### Fixed in 23.6.3

- SC-5250: Fixes the CSV-Import, if there are whitespaces in the columnnames
- SC-5686: only users with the team permission "RENAME_TEAM" can execute the patch method in teams route
- SC-5280: the LDAP sync now handles (timeout/firewall) errors much more gracefully
- SC-5280: LDAP bind operations will only be issued if the connection was established successfully
- SC-5280: aggregated LDAP statistics will now show the number of succesful and failed sub-syncs instead of just 1 or 0
- SC-5416: Enable maintenance Mode for LDAP Schools and change the currentSchoolYear for non-LDAP Schools

### Changed in 23.6.3

- SC-5542: Added an after hook for AdminUsers find method which formats birthday date to DD.MM.YYYY format.
- SC-4289 Changed aggregations in admin tables, classes are now taken only from current year or max grade level, and are sorted
  by numeric ordering.
- SC-5280: if disconnected prematurely, the LDAP service will not try to connect again just to unbind from the server

## [23.6.2] - 2020-07-22

### Fixed in 23.6.2

- SC-5773: LDAPSchoolSyncer now correctly populates classes synced from an LDAP server, even if only students or only teachers are assigned to the class.
- SC-5250: Fixes the CSV-Import, if there are whitespaces in the columnnames

## [23.6.1] - 2020-07-22

### Fixed in 23.6.1

- SC-5733: LDAPSchoolSyncer now uses the Users model service to avoid ignoring indexes due to automatic collation

## [23.6.0] - 2020-07-21

### Added in 23.6.0

- SC-4142: Added indexes on TSP sync related attributes in user and school schema.
- SC-4142: Adds info about unchanged entities to TSP sync statistics

## [23.5.4] - 2020-07-08

### Added in 23.5.4

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

### Added in 23.4.0-nbc

- SC-4577 extend consentversions with school specific privacy policy, which can be added by the school admin

## [23.2.4] - 2020-06-05

### Fixed in 23.2.4

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

- Unbind errors no longer stop the LDAP sync if more systems follow

## [22.10.2] - 2020-05-12

### Fixed in 22.10.2

- fixed pagination for students/teacher table

## [22.10.0] - 2020-05-11

### Added in 22.10.0

- SC-3719 Files now have a `creator` attribute that references the ID of the user that created the file.
  For old files, it is set to the first user permission inside the permissions array (legacy creator check).
- SC-3719 The `files` collection now has two additional indexes: `{creator}` and `{permissions.refId, permissions.refPermModel}`.
- add MongoDB Collation Support to control sorting behaviour in regards to capitalization.
- SC-3607 CSVSyncer now allows the optional birthday field (formats: dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy) in CSV data
- SC-3948 support users query in adminusers routes
- SC-4018 Add additional nexboard permissions
- SC-4008 Migrated generateRegistrationLink Hook from SC-Client into Server
- SC-3686 Added new Registration Link Service for sending mails
- SC-4094 Teachers can now provide feedback in the form of uploaded files

### Fixed in 22.10.0

- SC-3892 Update Filter of submission in order to work with older submissions
- SC-3395 if fetching the release fails, a error will be thrown
- backup.js now outputs valid json exports
- SC-4105 fixed a problem with new users tests not working with recent hotfix.
- Checks of user consent calculated correct now

### Changed in 22.10.0

- User delete now accepts bulk delete requests
- SC-3958: the "general" LDAP strategy now returns an empty array if classes are not configured properly
- Increase performance - error logging in sentry
- Mergify: add and modified some configs

### Removed in 22.10.0

- SC-3958: the LDAP strategy interface no longer supports synchronizing team members to the never-used original N21-IDM
- SC-3958: the environment variables NBC_IMPORTURL, NBC_IMPORTUSER, and NBC_IMPORTPASSWORD are no longer used and have been removed
- Removed the obsolete commentSchema from the homework service. It was not in use.

## [22.9.20]

### Added in 22.9.20

- SC-4042: Added support for a central IServ-Connector

### Changed in 22.9.20

- LDAP syncs on servers with multiple schools now only sync one school at a time to avoid issues when paging search requests
- LDAP syncs use less memory (because they do a lot less in parallel)
- LDAPSchoolSyncer now returns user and class statistics

### Fixed in 22.9.20

- Fixed LDAP-Service disconnect method
- LDAPSystemSyncers now properly close their connections after syncing
- Authentication via LDAP now tries to close the connection after login
- Fixed a warning message appearing when patching users via internal request

## [22.9.18]

### Fixed in 22.9.18

- SC-4215: Do not allow unprivileged users to find users with non-school roles (expert, parent, etc.)

## [22.9.17]

### Fixed in 22.9.17

- SC-4121: File uploads no longer fail if the security scan is misconfigured or errors during enqueuing

## [22.9.10]

### Added in 22.9.10

- enable API key for /mails route

### Fixed in 22.9.10

- fixed an issue that prevented api-key authenticated calls to function with query.

## [22.9.9]

### Added in 22.9.9

- Sync can now be authenticated with an api-key.

## [22.9.8]

### Fixed in 22.9.8

- Fixed an error where ldap users without proper uuid where not filtered correctly.

## [22.9.7]

### Security in 22.9.7

- the /ldap route can now only be triggered for the users own school.

## [22.9.6]

### Added in 22.9.6

- users without `SCHOOL_EDIT` permission, but with `SCHOOL_STUDENT_TEAM_MANAGE` permission can now toggle the school feature `disableStudentTeamCreation`.

### Fixed in 22.9.6

- Admins in Thuringia can now prevent students from creating teams

## [22.9.5]

### Security in 22.9.5

- increased security for the publicTeachers route.

## [22.9.4]

### Fixed in 22.9.4

- fixes an issue with LDAP account updates if more than one account exists for the user (migration from local login to LDAP)

## [22.9.3]

### Fixed in 22.9.3

- fixes regression in LDAP sync, that caused incomplete user updates

## [22.9.2]

### Security in 22.9.2

- increased security for user PUT operation

## [22.9.1]

### Fixed in 22.9.1

- SC-3994: remove unnecessary bucket creation call that caused school administration and LDAP Sync to throw errors

### Changed in 22.9.1

- use collation for /homeworks, /users, /publicTeachers, /users/admin/teachers, /users/admin/students, /classes, and /courses.

## [22.9.0]

- Security updates

## [22.8.0]

### Added in 22.8.0

- This changelog has been added

### Removed in 22.8.0

- Clipboard sockets
- This changelog has been added
- Backend route to confirm analog consents in bulk
- Changed Seed Data + Migration Script: Added feature flag for new Editor to klara.fall@schul-cloud.org
- SC-2922: Enable use of multiple S3 instances as file storage provider
  - A new collection is added to administrate multiple S3 instances
  - A migration will automatically use the AWS environment variables to add those as default provider for all existing schools
  - For new schools the less used provider is assigned as storage provider
  - Environment Variables:
    - FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED=true will activate the feature
    - S3_KEY, used for symmetric encryption, already required for the migration because of the secret access key encryption

### Changed in 22.8.0

- SC-3767: moved env variables to globals.js, NODE_ENV required to equal 'test' for test execution and right database selection
- migrated backup.sh script to node, so it can run platform independant and works on windows.

### Fixed in 22.8.0

- SC-3821: Fix Co-Teachers and Substitution teachers not being able to Grade Homeworks

## 22.7.1

### Fixed in 22.7.1

- Admin and teacher user could change other users without changing them self
