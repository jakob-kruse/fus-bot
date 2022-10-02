import Twitter from 'twitter-lite'
import { twitterEnv } from './env'
import { TwitterTweet, TwitterStreamParams } from './types'

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
