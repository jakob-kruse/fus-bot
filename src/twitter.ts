import Twitter from 'twitter-lite'
import { twitterEnv } from './env'
import { TwitterTweet, TwitterStreamParams } from './types'
import { promises as fs } from 'fs'

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
	return twitter.post(`statuses/retweet/${tweetId}`, {}).catch(console.error)
}

export async function getNewMessages() {
	let lastMessageTimestamp = await fs.readFile('last-message-timestamp.txt', 'utf8').catch(() => '')

	const messageRes = await twitter.get('direct_messages/events/list').catch(console.error)

	if (!messageRes?.events) {
		return []
	}

	let messages = messageRes.events.filter(
		(event) =>
			event?.message_create?.sender_id !== twitterEnv.OWNER_ID &&
			event?.message_create?.message_data?.text?.includes('ignore')
	)

	if (lastMessageTimestamp) {
		messages = messages.filter(
			(event) => parseInt(event.created_timestamp) > parseInt(lastMessageTimestamp!)
		)
	}

	if (messages.length > 0) {
		await fs.writeFile('last-message-timestamp.txt', messages[0].created_timestamp)
	}

	return messages
}
