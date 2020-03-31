# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- This changelog has been added
- SC-3917 Files now have a `creator` attribute that references the ID of the user that created the file.
For old files, it is set to the first user permission inside the permissions array (legacy creator check).
- SC-3917 The `files` collection now has two additional indexes: `{creator}` and `{permissions.refId, permissions.refPermModel}`.

### Changed
- SC-3917 Files prefer to use the new `creator` attribute over the old creator-check (first permission object)
