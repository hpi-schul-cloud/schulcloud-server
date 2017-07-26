const removeLeadingSlash = path => {
	if (path[0] === '/') path = path.substring(1);
	return path;
};

const generateFileNameSuffix = fileName => {
	let currentTimeStamp = Date.now();
	return `${currentTimeStamp}-${fileName}`;
};

module.exports  = {
	removeLeadingSlash,
	generateFileNameSuffix
};
