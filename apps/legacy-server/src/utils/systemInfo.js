const { loadavg, uptime, freemem, totalmem } = require('os');
// cpus
// networkInterfaces
const byteToMB = (byte = 0) => {
	return byte / 1024 / 1024;
};

// https://nodejs.org/api/process.html#process_process_memoryusage
const memoryUsage = () => {
	const result = process.memoryUsage();
	return {
		rss_MB: byteToMB(result.rss),
		heapTotal_MB: byteToMB(result.heapTotal),
		heapUsed_MB: byteToMB(result.heapUsed),
		external_MB: byteToMB(result.external),
		arrayBuffers_MB: byteToMB(result.arrayBuffers),
	};
};

// https://nodejs.org/api/os.htm
const info = {};
info.memory = () => ({
	pid: process.pid,
	uptime: uptime(),
	loadavg: loadavg(),
	memoryUsage: memoryUsage(),
	freemem_MB: byteToMB(freemem()),
	totalmem_MB: byteToMB(totalmem()),
});
module.exports = {
	info,
	memoryUsage,
};
