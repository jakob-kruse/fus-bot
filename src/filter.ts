import { getIgnoreRules } from './cms'
import { twitterEnv } from './env'
import { TwitterTweet } from './types'

export async function isFiltered(tweet: TwitterTweet) {
	if (tweet.user.id_str === twitterEnv.OWNER_ID) {
		return true
	}

	const ignoreRules = await getIgnoreRules()

	if (!ignoreRules) {
		console.log('WARNING: No ignore rules found')
		return false
	}

	return ignoreRules.some((rule) => {
		if (rule.screen_name && rule.screen_name === tweet.user.screen_name) {
			return true
		}

		if (rule.regex && new RegExp(rule.regex).test(tweet.text)) {
			return true
		}

		if (rule.contains && tweet.text.toLowerCase().includes(rule.contains.toLowerCase())) {
			return true
		}

		return false
	})
}
