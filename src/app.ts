import { cms, getIgnoreRules, getStreamParams, ignoreUserById, saveTweet } from './cms'
import { isFiltered } from './filter'
import { logger } from './logger'
import { getNewMessages, retweet, startStream, twitter } from './twitter'
import { TwitterTweet } from './types'

const streamLog = logger.child({ module: 'stream' })

async function onTweet(tweet: TwitterTweet) {
	streamLog.trace('Recieved tweet: [%s] @%s "%s"', tweet.id_str, tweet.user.screen_name, tweet.text)

	const filtered = await isFiltered(tweet)

	if (!filtered) {
		// await saveTweet(tweet)
		await retweet(tweet.id_str)
	}
}

function onError(error: Error) {
	streamLog.error('Error: %o', error)
}

function onEnd() {
	streamLog.info('Ended')
	process.exit(1)
}

function onPing() {
	streamLog.debug('Ping')
}

async function checkForIgnoreMessages() {
	const newMessages = await getNewMessages()

	streamLog.info('Found %s new messages', newMessages.length)

	if (newMessages.length > 0) {
		for (const message of newMessages) {
			await ignoreUserById(message.message_create.sender_id)
				.then(() => {
					return twitter
						.post('direct_messages/events/new', {
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
						.catch((error) => {
							streamLog.error('Error sending message: %o', error)
						})
				})
				.catch((error) => {
					streamLog.error('Failed to ignore user: %o', error)
				})

			streamLog.info('Ignored user %s', message.message_create.sender_id)
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

	await checkForIgnoreMessages()

	setInterval(async () => {
		await checkForIgnoreMessages()
	}, 1000 * 60 * 5)

	streamLog.info('Starting stream with parameters: %o', streamParams)

	try {
		startStream({
			params: streamParams,
			events: {
				onEnd,
				onError,
				onPing,
				onTweet,
			},
		})
	} catch (error) {
		process.exit(1)
	}
}

start()
