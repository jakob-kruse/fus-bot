import { getIgnoreRules } from './cms'
import { twitterEnv } from './env'
import { TwitterTweet } from './types'

export async function isFiltered(tweet: TwitterTweet) {
	if (tweet.user.id_str === twitterEnv.OWNER_ID || !!tweet.retweeted_status) {
		return true
	}

	const ignoreRules = await getIgnoreRules()

	if (!ignoreRules) {
		console.log('WARNING: No ignore rules found')
		return false
	}

	return ignoreRules.some((rule) => {
		if (rule.screen_name && rule.screen_name === tweet.user.screen_name) {
			console.log(`Matched screen name rule: ${rule.screen_name}`)

			return true
		}

		if (rule.regex && new RegExp(rule.regex).test(tweet.text)) {
			console.log(`Matched regex rule: ${rule.regex}`)
			return true
		}

		if (rule.contains && tweet.text.toLowerCase().includes(rule.contains.toLowerCase())) {
			console.log(`Matched contains rule: ${rule.contains}`)
			return true
		}

		return false
	})
}
