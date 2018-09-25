/**
 * This helper retrieves the host capabilities for a specific file;
 * for now it is enough to return the default capabilities for each file since
 * there is no more information stored in the file-model
 * 
 * Host-Capabilities: https://wopirest.readthedocs.io/en/latest/files/CheckFileInfo.html#wopi-host-capabilities-properties
 */
const HOST_CAPABILITIES = [
  "SupportsCobalt", 
  "SupportsContainers",
  "SupportsDeleteFile",
  "SupportsEcosystem",
  "SupportsExtendedLockLength",
  "SupportsFolders",
  "SupportsGetFileWopiSrc",
  "SupportsGetLock",
  "SupportsLocks",
  "SupportsRename",
  "SupportsUpdate",
  "SupportsUserInfo",
  "UserCanRename"
];

//TODO: Check UserCanWrite/UserCanRename via extra perm check

const CURRENTLY_IMPLEMENTED = ["SupportsDeleteFile", "SupportsLocks", "SupportsGetLock", "SupportsRename", "SupportsUpdate", "UserCanRename"];

const defaultCapabilities = () => {
  let caps = {};
  HOST_CAPABILITIES.forEach(h => caps[h] = CURRENTLY_IMPLEMENTED.includes(h));
  return caps;
};

module.exports = {defaultCapabilities};
