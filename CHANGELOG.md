# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Allowed Types of change: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

## Unreleased

### Added

  - Changed Seed Data + Migration Script: Added feature flag for new Editor to klara.fall@schul-cloud.org
  - This changelog has been added
  - SC-2922 Enable use of multiple S3 instances as file storage provider
    - A new collection is added to administrate multiple S3 instances 
    - A migration will automatically use the AWS environment variables to add those as default provider for all existing schools
    - For new schools the less used provider is assigned as storage provider
  	- Environment Variables:
  	  - FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED=true will activate the feature
  	  - S3_KEY, used for symmetric encryption, already required for the migration because of the secret access key encryption
