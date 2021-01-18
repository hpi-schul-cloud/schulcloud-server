module.exports = (req, res, next) => {
	res.setHeader('Content-Type', `image/png`);
	res.setHeader('Content-Disposition', `attachment;filename=someVeryCoolQRCode.png`);
	res.send(res.data)
};