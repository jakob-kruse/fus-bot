module.exports = {
	apps: [
		{
			name: 'fus bot',
			script: 'pnpm start',
			max_memory_restart: '10M',
			log_date_format: 'DD.MM.YYYY HH:mm:ss',
			error_file: 'logs/err.log',
			out_file: 'logs/out.log',
			time: true,
			restart_delay: 20000,
		},
	],
}
