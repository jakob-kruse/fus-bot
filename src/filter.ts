import { getIgnoreRules } from './cms'
import { twitterEnv } from './env'
import { logger } from './logger'
import { TwitterTweet } from './types'

const filterLog = logger.child({ module: 'filter' })

export async function isFiltered(tweet: TwitterTweet) {
	filterLog.trace('Checking if tweet is filtered: %o', tweet)

	if (tweet.user.id_str === twitterEnv.OWNER_ID) {
		filterLog.trace('Tweet is from owner')
		return true
	}

	if (!!tweet.retweeted_status) {
		filterLog.trace('Tweet is a retweet')
		return true
	}

	const ignoreRules = await getIgnoreRules()

	if (!ignoreRules) {
		filterLog.warn('No ignore rules found. Skipping CMS filters')
		return false
	}

	const tweetText = tweet.text.toLowerCase().split('\n').join(' ').trim()
	const screenName = tweet.user.screen_name.toLowerCase()

	for (const rule of ignoreRules) {
		if (rule.screen_name && rule.screen_name === screenName) {
			filterLog.trace('Rule [%s] matched. screen_name === %s', rule.id, screenName)
			return true
		}

		if (rule.screen_name_regex && new RegExp(rule.screen_name_regex).test(screenName)) {
			filterLog.trace('Rule [%s] matched. screen_name_regex === %s', rule.id, screenName)
			return true
		}

		if (rule.regex && new RegExp(rule.regex).test(tweetText)) {
			filterLog.trace('Rule [%s] matched. regex === %s', rule.id, rule.regex)
			return true
		}

		if (rule.contains && tweetText.includes(rule.contains.toLowerCase())) {
			filterLog.trace('Rule [%s] matched. contains %s', rule.id, rule.contains)
			return true
		}
	}

	filterLog.trace('No rule matched')

	return false
}
