const multer = require('multer');

const hooks = require('./hooks');
const WalletService = require('./services/walletService');
const WalletFileService = require('./services/walletFileService');

module.exports = (app) => {
	const fileMiddleware = multer();

	app.use('/wallet', new WalletService());
	const walletService = app.service('/wallet');
	walletService.hooks(hooks);

	app.use(
		'/wallet/files',
		fileMiddleware.single('file'),
		(req, res, next) => {
			req.feathers.file = req.file;

			next();
		},
		new WalletFileService()
	);

	const walletFileService = app.service('/wallet/files');
	walletFileService.hooks(hooks);
};
