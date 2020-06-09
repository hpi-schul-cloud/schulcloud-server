module.exports = (req, res, next) => {
	if (res.statusCode === 200 && req.query.download === 'true' && res.data.data) { // und get
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename="Nutzungsbedingungen.pdf"');
		res.send(res.data.data);
	} else {
		next();
	}
};
