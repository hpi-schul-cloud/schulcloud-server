const multer = require('multer');

const service = require('feathers-mongoose');
const hooks = require('./hooks');
const walletModelHooks = require('./hooks/walletModel.hooks');
const WalletService = require('./services/walletService');
const WalletFileService = require('./services/walletFileService');

const { walletModel } = require('./model');

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

	app.use(
		'/walletModel',
		service({
			Model: walletModel,
			lean: true,
			paginate: {
				default: 25,
			},
		})
	);

	const walletModelService = app.service('/walletModel');
	walletModelService.hooks(walletModelHooks);
};
