# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## Unreleased

### Added
-   This changelog has been added.
-   SC-3731 Rewrite role static service.
   -   Added new npm package sift to filter array data with mongoose like querys.
   -   Added static section for roleDisplayNames.
   -   Added role utils to map permissions of inherit roles.
   -   Add util to pass errors as second parameter to feathers.

### Changed
-   SC-3731 Rewrite role static service.
   -   Rewrite role services. It is a static service now.
   -   Resort error handling, to avoid catch error location by throwing new errors by errors without error code.
   -   Clarify RoleModel imports in Schema of { RoleModel }
   -   Change some tests that it work with new static logic in role service.
   -   Remove all permission checks from role service.

### Fixed
-   This changelog has been added
-   SC-3731 Rewrite role static service.
   -   Different tests that do not wait for server is listen.
-   Changed Seed Data + Migration Script: Added feature flag for new Editor to klara.fall@schul-cloud.org
-   SC-2922 Enable use of multiple S3 instances as file storage provider
   -   A new collection is added to administrate multiple S3 instances 
   -   A migration will automatically use the AWS environment variables to add those as default provider for all existing schools
   -   For new schools the less used provider is assigned as storage provider
   -   Environment Variables:
      -   FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED=true will activate the feature
      -   S3_KEY, used for symmetric encryption, already required for the migration because of the secret access key encryption
-   SC-3821: Fix Co-Teachers and Substitution teachers not being able to Grade Homeworks

