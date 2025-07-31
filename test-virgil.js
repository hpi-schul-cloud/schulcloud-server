dns = require('dns');


//dns.lookup('session-valkey-headless.bc-10295-rooms-bettermarks.svc.cluster.local', (err, address, family) => {
dns.lookup('r3.m-b3j96uddm1m3nacc.mongodb.de-txl.ionos.com', (err, address, family) => {
	if (err) {
		console.error('DNS lookup failed:', err);
		return;
	}
	console.log(`Address: ${address}, Family: IPv${family}`);
});

// dns.setServers(['127.0.0.1']);
/*
dns.resolve4('session-valkey-headless.bc-10295-rooms-bettermarks.svc.cluster.local', (err, records) => {
	console.log(err || records);
});
*/