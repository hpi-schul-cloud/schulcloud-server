const { loadavg, cpus, networkInterfaces, uptime, freemem, totalmem } = require('os');

const byteToMB = (byte) => {
	if (byte <= 0) {
		return byte;
	}
	return byte / 1024 / 1024;
};

const secToMin = (sec) => {
	if (sec <= 0) {
		return sec;
	}
	return sec / 60;
};

const pid = () => process.pid;

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
	pid: pid(),
	uptime_Minute: secToMin(uptime()),
	loadavg: loadavg(),
	memoryUsage: memoryUsage(),
	freemem_MB: byteToMB(freemem()),
	totalmem_MB: byteToMB(totalmem()),
});
module.exports = {
	info,
	pid,
	memoryUsage,
	loadavg,
	cpus,
	networkInterfaces,
	freemem,
	totalmem,
	uptime,
};
