module.exports = {
	apps: [
		{
			name: 'fus bot',
			script: 'pnpm start',
			error_file: 'logs/err.log',
			out_file: 'logs/out.log',
			cron_restart: '0 */2 * * *',
			time: false,
			env: {
				LOG_LEVEL: 'trace',
			},
		},
	],
}
