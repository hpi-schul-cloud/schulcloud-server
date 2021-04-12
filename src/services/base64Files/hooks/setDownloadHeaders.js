module.exports = (req, res, next) => {
	const { data, filename, filetype } = res.data;
	if (res.statusCode === 200 && req.query.download === 'true' && data && filename && filetype) {
		res.setHeader('Content-Type', `application/${filetype}`);
		res.setHeader('Content-Disposition', `attachment; filename="${filename}.${filetype}"`);
		res.send(data);
	} else {
		next();
	}
};
