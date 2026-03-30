# H5P Scripts

## Structure

This folder contains scripts and helper modules for managing H5P libraries in the Schulcloud server. Below is an overview of the files and their functions:

### Main Scripts
- **update-h5p-map.ts**: Updates the mapping of H5P libraries to their respective GitHub repositories, typically used to keep track of available versions and sources.
- **package-h5p-libraries.ts**: Packages H5P libraries from GitHub repositories, including downloading, building, and running consistency checks.
- **upload-h5p-libraries.ts**: Handles the upload of packaged H5P libraries to S3 cloud storage.

### Subfolders

#### config/
- **h5p-library-repo-map.yaml**: YAML configuration file mapping H5P library names to their repository sources. Used for automated builds and updates.

#### helper/
- **file-system.helper.ts**: Utility functions for file system operations, such as reading, writing, and managing files related to H5P libraries.
- **h5p-logger.helper.ts**: Logging utility with configurable log levels for consistent output across all scripts.
- **s3-client.helper.ts**: Helper functions for interacting with Amazon S3, used for storing or retrieving H5P libraries from cloud storage.

#### interface/
- **github-content-tree.response.ts**: TypeScript interface for GitHub content tree API responses.
- **github-repository.response.ts**: TypeScript interface for GitHub repository API responses.
- **github-tag.response.ts**: TypeScript interface for GitHub tag API responses.
- **h5p-library.ts**: TypeScript interface for H5P library.json structure.
- **h5p-semantics.ts**: TypeScript interface for H5P semantics.json structure.

#### service/
- **h5p-github.client.ts**: Client module for interacting with GitHub repositories that host H5P libraries.
- **h5p-hub.client.ts**: Client module for interacting with the H5P Hub API to fetch current library versions.
- **h5p-consistency-checker.service.ts**: Service for validating H5P library packages (checks for missing JS/CSS files).
- **h5p-library-packager.service.ts**: Service for packaging H5P libraries, including downloading from GitHub, building, and validating.
- **h5p-library-uploader.service.ts**: Service for uploading H5P libraries to S3 cloud storage.

## Running scripts


### Running scripts manually

To run any of the main scripts in this folder manually, you need to first compile the TypeScript file to JavaScript, then run the compiled file.

#### Step 1: Compile TypeScript to JavaScript

```bash
tsc scripts/h5p/<script-name>.ts --esModuleInterop
```

This generates a corresponding `.js` file in the same directory.

#### Step 2: Load environment variables (optional)

If the script requires environment variables, load them from your `.env` file:

```bash
source .env
```

#### Step 3: Run the compiled JavaScript file

```bash
node scripts/h5p/<script-name>.js
```

#### Combined example

To compile and run `package-h5p-libraries.ts`:

```bash
tsc scripts/h5p/package-h5p-libraries.ts --esModuleInterop
set -a && source .env && set +a
node scripts/h5p/package-h5p-libraries.js
```

Or as a single command:

```bash
tsc scripts/h5p/package-h5p-libraries.ts --esModuleInterop && set -a && source .env && set +a && node ./scripts/h5p/package-h5p-libraries.js
```

### Running scripts using npm

You can also run these scripts using npm commands defined in the repository's `package.json`. For example:

```bash
npm run h5p:package-h5p-libraries
npm run h5p:update-h5p-map
npm run h5p:upload-h5p-libraries
```

These commands internally execute the corresponding scripts in this folder. Check `package.json` for the exact script names and available npm commands.

## Required Environment Variables

### update-h5p-map.ts

To update the H5P library to GitHub repository map using `update-h5p-map.ts`, you need the following environment variable:

- `GITHUB_PERSONAL_ACCESS_TOKEN`: Required. Set this variable to a valid GitHub personal access token. Without a token, the script uses unauthenticated GitHub API access, which is limited to 60 requests per hour and will likely fail for larger operations. With a token, the rate limit increases to 5,000 requests per hour. A token is also required to access private repositories.

Set this variable in your environment before running the script.

### package-h5p-libraries.ts

To package H5P libraries using `package-h5p-libraries.ts`, you need the following environment variable:

- `GITHUB_PERSONAL_ACCESS_TOKEN`: Required. Set this variable to a valid GitHub personal access token. Without a token, the script uses unauthenticated GitHub API access, which is limited to 60 requests per hour and will likely fail for larger operations. With a token, the rate limit increases to 5,000 requests per hour. A token is also required to access private repositories.

Set this variable in your environment before running the script.

### upload-h5p-libraries.ts

For uploading H5P libraries, only the following environment variables for the S3 Client Helper are required:

- `H5P_EDITOR__S3_ENDPOINT`: The S3 endpoint URL (required)
- `H5P_EDITOR__S3_REGION`: The S3 region (required)
- `H5P_EDITOR__LIBRARIES_S3_ACCESS_KEY_ID`: The S3 access key ID (required)
- `H5P_EDITOR__LIBRARIES_S3_SECRET_ACCESS_KEY`: The S3 secret access key (required)
- `H5P_EDITOR__S3_BUCKET_LIBRARIES`: The S3 bucket name for libraries (required)

No other environment variables are necessary for the standard upload.

Make sure these variables are set in your environment before running the script. If they are missing, the upload will fail with an authentication or permission error.