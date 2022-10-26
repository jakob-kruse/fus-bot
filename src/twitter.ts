import Twitter from 'twitter-lite'
import { twitterEnv } from './env'
import { TwitterTweet, TwitterStreamParams } from './types'
import { promises as fs } from 'fs'
import { logger } from './logger'

const twitterLogger = logger.child({ module: 'twitter' })

export const twitter = new Twitter({
	consumer_key: twitterEnv.CONSUMER_KEY,
	consumer_secret: twitterEnv.CONSUMER_SECRET,
	access_token_key: twitterEnv.ACCESS_TOKEN_KEY,
	access_token_secret: twitterEnv.ACCESS_TOKEN_SECRET,
})

export function startStream({
	params,
	events: { onTweet, onError, onPing, onEnd },
}: {
	params: TwitterStreamParams
	events: Partial<{
		onTweet: (tweet: TwitterTweet) => void
		onError: (error: Error) => void
		onPing: () => void
		onEnd: () => void
	}>
}) {
	return twitter
		.stream('statuses/filter', params)
		.on('data', onTweet ?? (() => {}))
		.on('ping', onPing ?? (() => {}))
		.on('error', onError ?? (() => {}))
		.on('end', onEnd ?? (() => {}))
}

export async function retweet(tweetId: string) {
	return twitter.post(`statuses/retweet/${tweetId}`, {}).catch((error) => {
		twitterLogger.error('Error retweeting: %o', error)
	})
}

export async function getNewMessages() {
	let lastMessageTimestamp = await fs
		.readFile('last-message-timestamp.txt', 'utf8')
		.catch(() => '0')

	const messageRes = await twitter.get('direct_messages/events/list').catch((error) => {
		twitterLogger.error('Error getting messages: %o', error)
	})

	if (!messageRes?.events) {
		return []
	}

	twitterLogger.debug('Found %s messages', messageRes.events.length)
	twitterLogger.trace('Messages: %o', messageRes.events)

	let messages = messageRes.events.filter(
		(event) =>
			event?.message_create?.sender_id !== twitterEnv.OWNER_ID &&
			['ignore', 'ignorier', 'ignorieren', 'block', 'blockieren'].includes(
				event?.message_create?.message_data?.text?.toLowerCase()
			) &&
			parseInt(event.created_timestamp) > parseInt(lastMessageTimestamp!)
	)

	if (messages.length > 0) {
		await fs.writeFile('last-message-timestamp.txt', messages[0].created_timestamp)
	}

	return messages
}
