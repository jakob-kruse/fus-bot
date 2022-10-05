module.exports = {
	apps: [
		{
			name: 'fus bot',
			script: 'pnpm start',
			max_memory_restart: '10M',
			error_file: 'logs/err.log',
			out_file: 'logs/out.log',
			time: false,
			restart_delay: 20000,
		},
	],
}
