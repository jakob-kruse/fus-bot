export type TwitterTweet = {
	id_str: string
	text: string
	user: {
		id_str: string
		screen_name: string
	}
	retweeted_status: TwitterTweet | null
}

export type TwitterStreamParams = Partial<{
	delimited: string
	stall_warnings: string
	filter_level: string
	language: string
	follow: string
	track: string
	locations: string
	count: string
}>
