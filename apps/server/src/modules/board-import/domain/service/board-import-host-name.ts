export const SUBDOMAIN_PREFIX = '*.';

// Labels are not empty and the last label starts with a letter. Thus IP addresses, empty labels and a dot at the end
// do not match.
const HOST_NAME_PATTERN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]([a-z0-9-]*[a-z0-9])?$/;

export const isHostName = (host: string): boolean => {
	const result = HOST_NAME_PATTERN.test(host);

	return result;
};
