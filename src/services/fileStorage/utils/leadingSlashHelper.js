module.exports  = path => {
	if (path[0] === '/') path = path.substring(1);
	return path;
};
