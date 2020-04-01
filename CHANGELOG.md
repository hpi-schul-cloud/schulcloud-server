# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## Unreleased

### Added
- This changelog has been added.
- Added new npm package sift to filter array data with mongoose like querys.
- Added static section for roleDisplayNames.
- Added role utils to map permissions of inherit roles.
- Add util to pass errors as second parameter to feathers.

### Changed
- Rewrite role services. It is a static service now.
- Resort error handling, to avoid catch error location by throwing new errors by errors without error code.
- Clarify RoleModel imports in Schema of { RoleModel }
- Change some tests that it work with new static logic in role service.
- Remove all permission checks from role service.

### Fixed
- Different tests that do not wait for server is listen.
