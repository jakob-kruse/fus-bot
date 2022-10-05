import { cms, getIgnoreRules, getStreamParams, ignoreUserById, saveTweet } from './cms'
import { isFiltered } from './filter'
import { logger } from './logger'
import { getNewMessages, retweet, startStream, twitter } from './twitter'
import { TwitterTweet } from './types'

const streamLog = logger.child({ module: 'stream' })

async function onTweet(tweet: TwitterTweet) {
	streamLog.trace('Recieved tweet: [%s] @%s "%s"', tweet.id_str, tweet.user.screen_name, tweet.text)

	const filtered = await isFiltered(tweet)

	await saveTweet(tweet, filtered)

	if (!filtered) {
		await retweet(tweet.id_str)
	}
}

function onError(error: Error) {
	streamLog.error('Error: %o', error)
}

function onEnd() {
	streamLog.info('Ended')

	setTimeout(() => {
		streamLog.info('Restarting stream')
		start()
	}, 5000)
}

function onPing() {
	streamLog.debug('Ping')
}

async function checkForIgnoreMessages() {
	const newMessages = await getNewMessages()

	if (newMessages.length > 0) {
		streamLog.info('Found %s new messages', newMessages.length)

		for (const message of newMessages) {
			await ignoreUserById(message.message_create.sender_id)

			streamLog.info('Ignored user %s', message.message_create.sender_id)

			await twitter.post('direct_messages/events/create', {
				event: {
					type: 'message_create',
					message_create: {
						target: {
							recipient_id: message.message_create.sender_id,
						},
						message_data: {
							text: 'Du wirst nun nicht mehr retweetet',
						},
					},
				},
			})
		}
	}
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

	await checkForIgnoreMessages()

	setInterval(async () => {
		await checkForIgnoreMessages()
	}, 1000 * 60 * 5)

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
