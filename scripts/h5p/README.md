# H5P Scripts

## Structure

This folder contains scripts and helper modules for managing H5P libraries in the Schulcloud server. Below is an overview of the files and their functions:

### Main Scripts
- **update-h5p-map.js**: Updates the mapping of H5P libraries to their respective GitHub repositories, typically used to keep track of available versions and sources.
- **build-h5p-libraries.js**: Builds H5P libraries from source or configuration.
- **upload-h5p-libraries.js**: Handles the upload of H5P libraries to the server or external storage.

### Subfolders

#### config/
- **h5p-library-repo-map.yaml**: YAML configuration file mapping H5P library names to their repository sources. Used for automated builds and updates.

#### helper/
- **file-system.helper.js**: Utility functions for file system operations, such as reading, writing, and managing files related to H5P libraries.
- **s3-client.helper.js**: Helper functions for interacting with Amazon S3, used for storing or retrieving H5P libraries from cloud storage.

#### service/
- **h5p-github.client.js**: Client module for interacting with GitHub repositories that host H5P libraries.
- **h5p-library-builder.service.js**: Service for building H5P libraries, including compiling and packaging.
- **h5p-library-uploader.service.js**: Service for uploading H5P libraries to the server or external storage.

## Running scripts


### Running scripts manually

To run any of the main scripts in this folder manually, use the following command from the repository root or the `scripts/h5p` directory:

```bash
node scripts/h5p/<script-name>.js
```

Replace `<script-name>.js` with the desired script, e.g. `build-h5p-libraries.js`.

### Running scripts using npm

You can also run these scripts using npm commands defined in the repository's `package.json`. For example:

```bash
npm run h5p:build-libraries
npm run h5p:update-map
npm run h5p:upload-libraries
```

These commands internally execute the corresponding scripts in this folder. Check `package.json` for the exact script names and available npm commands.

## Required Environment Variables

### update-h5p-map.js

To update the H5P library to GitHub repository map using `update-h5p-map.js`, you only need the following environment variable:

- `GITHUB_PERSONAL_ACCESS_TOKEN`: Required if you need to access private repositories or increase GitHub API rate limits. Set this variable to a valid GitHub personal access token.

Set this variable in your environment before running the script to avoid authentication or permission errors.

### build-h5p-libraries.js

To build H5P libraries using `build-h5p-libraries.js`, you only need the following environment variable:

- `GITHUB_PERSONAL_ACCESS_TOKEN`: Required if you need to access private repositories or increase GitHub API rate limits. Set this variable to a valid GitHub personal access token.

Set this variable in your environment before running the script to avoid authentication or permission errors.

### upload-h5p-libraries.js

For uploading H5P libraries, only the following environment variables for the S3 Client Helper are required:

- `H5P_EDITOR__S3_ENDPOINT`: The S3 endpoint URL (required)
- `H5P_EDITOR__S3_REGION`: The S3 region (required)
- `H5P_EDITOR__LIBRARIES_S3_ACCESS_KEY_ID`: The S3 access key ID (required)
- `H5P_EDITOR__LIBRARIES_S3_SECRET_ACCESS_KEY`: The S3 secret access key (required)
- `H5P_EDITOR__S3_BUCKET_LIBRARIES`: The S3 bucket name for libraries (required)

No other environment variables are necessary for the standard upload.

Make sure these variables are set in your environment before running the script. If they are missing, the upload will fail with an authentication or permission error.