import { getStreamParams } from './cms'
import { isFiltered } from './filter'
import { retweet, startStream } from './twitter'

async function start() {
	const streamParameters = await getStreamParams()

	if (!streamParameters) {
		console.log('ERROR: No stream parameters found')
		return
	}

	if (!streamParameters.track) {
		console.log('ERROR: No track parameters found')
		return
	}

	const streamParams = {
		track: streamParameters.track,
		filter_level: streamParameters.filter_level ?? 'none',
		language: streamParameters.language ?? 'de',
	}

	console.log('Starting stream with parameters:', streamParams)

	startStream({
		params: streamParams,
		events: {
			onEnd: console.log,
			onError: console.log,
			onTweet: async (tweet) => {
				const filtered = await isFiltered(tweet)

				if (!filtered) {
					await retweet(tweet.id_str)
				}
			},
		},
	})
}

start()
