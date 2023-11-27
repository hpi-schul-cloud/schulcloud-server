const logger = require('../../src/logger');

class OutputLogTempalte {
	constructor({ total, name, _logger, _detailInformations = false, _lineBreak = '\n' }) {
		this.modified = [];
		this.fail = [];
		this.LF = _lineBreak;
		this.total = total || 0;
		this.l = _logger || logger;
		this.name = name || '';
		this.detailInformations = _detailInformations;
	}

	push(type, value) {
		if (Array.isArray(this[type])) {
			this[type].push(value);
			return true;
		}
		return false;
	}

	convertToErrorOutput(_id, error) {
		const id = _id.toString();

		if (typeof error === 'object') {
			return { id, ...error };
		}

		if (typeof error === 'string') {
			return {
				id,
				message: error,
			};
		}
		return error;
	}

	pushFail(id, error) {
		return this.push('fail', this.convertToErrorOutput(id, error));
	}

	pushModified(id) {
		return this.push('modified', id);
	}

	printResults(self = this, taskCount) {
		const modified = self.modified.length;
		const fail = self.fail.length;
		const notModified = self.total - modified - fail;

		self.l.info(self.LF);
		self.l.info(`total: ${self.total}`);
		if (taskCount) {
			self.l.info(`tasks: ${taskCount}`);
		}
		self.l.info(`modified: ${modified}`);
		if (self.detailInformations) {
			self.l.info(`...: ${self.modified}`);
		}
		self.l.info(`notModified: ${notModified}`);
		if (self.fail.length > 0) {
			self.l.warning(`fail: ${fail}`);
			self.l.warning(JSON.stringify(self.fail));
		} else {
			self.l.info('fail: 0');
		}
		self.l.info(self.LF);
		self.l.info(`...${self.name} is finished!`);
		self.l.info('<---------------------------------->');
	}
}

module.exports = OutputLogTempalte;
