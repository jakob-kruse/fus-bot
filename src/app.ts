import { cms, getIgnoreRules, getStreamParams } from './cms'
import { isFiltered } from './filter'
import { logger } from './logger'
import { retweet, startStream } from './twitter'
import { TwitterTweet } from './types'

const streamLog = logger.child({ module: 'stream' })

async function onTweet(tweet: TwitterTweet) {
	streamLog.trace('Recieved tweet: [%s] @%s "%s"', tweet.id_str, tweet.user.screen_name, tweet.text)

	const filtered = await isFiltered(tweet)

	if (!filtered) {
		await retweet(tweet.id_str)
	}
}

function onError(error: Error) {
	streamLog.error('Error: %o', error)
}

function onEnd() {
	streamLog.info('Ended')
}

function onPing() {
	streamLog.debug('Ping')
}

async function start() {
	const streamParameters = await getStreamParams()

	if (!streamParameters) {
		streamLog.error('No stream parameters found')
		return
	}

	if (!streamParameters.track) {
		streamLog.error('No track parameter found')
		return
	}

	const streamParams = {
		track: streamParameters.track,
		filter_level: streamParameters.filter_level ?? 'none',
		language: streamParameters.language ?? 'de',
	}

	streamLog.info('Starting stream with parameters: %o', streamParams)

	startStream({
		params: streamParams,
		events: {
			onEnd,
			onError,
			onPing,
			onTweet,
		},
	})
}

start()
