import { Directus } from '@directus/sdk'
import { cmsEnv } from './env'
import { logger } from './logger'
import { TwitterStreamParams, TwitterTweet } from './types'

const cmsLogger = logger.child({ module: 'cms' })

let sessionExpires: Date

export type CMSTypeMap = {
	fus_bot_ignore_rules: {
		id: number
		status: 'published' | 'draft' | 'archived'
		screen_name: string | null
		screen_name_regex: string | null
		regex: string | null
		contains: string | null
		user_id: string | null
	}
	fus_bot_parameters: TwitterStreamParams
	tweets: {
		id: string
		text: string
		user_id: string
		raw: string
	}
}

export const cms: Directus<CMSTypeMap> = new Directus<CMSTypeMap>(cmsEnv.CMS_URL)

export async function ensureAuth() {
	if (sessionExpires && sessionExpires > new Date()) {
		cmsLogger.trace('Session is still valid. Skipping auth')
		return
	}

	await cms.auth
		.refresh()
		.then(() => {
			cmsLogger.debug('Auth is still valid')
		})
		.catch(async () => {
			cmsLogger.debug('Refreshing Auth')

			await cms.auth
				.login({
					email: cmsEnv.CMS_EMAIL,
					password: cmsEnv.CMS_PASSWORD,
				})
				.then((result) => {
					sessionExpires = new Date(new Date().getTime() + result.expires)
				})
				.catch(() => {
					cmsLogger.error('Failed to login to CMS')
					process.exit(1)
				})
		})
}

export async function getIgnoreRules() {
	await ensureAuth()

	const cmsResponse = await cms.items('fus_bot_ignore_rules').readByQuery({
		limit: -1,
	})

	return cmsResponse.data as CMSTypeMap['fus_bot_ignore_rules'][]
}

export async function getStreamParams() {
	await ensureAuth()

	const cmsResponse = await cms.items('fus_bot_parameters').readByQuery({
		fields: '*.*',
	})

	return cmsResponse.data as TwitterStreamParams
}

export async function saveTweet(tweet: TwitterTweet) {
	await ensureAuth()

	return await cms.items('tweets').createOne({
		id: tweet.id_str,
		text: tweet.text,
		user_id: tweet.user.id_str,
		raw: JSON.stringify(tweet),
	})
}

export async function ignoreUserById(id: string) {
	await ensureAuth()

	const existing = await cms
		.items('fus_bot_ignore_rules')
		.readByQuery({
			filter: {
				user_id: {
					_eq: id,
				},
			},
		})
		.catch(() => {
			cmsLogger.error('Failed to get existing ignore rules')
			return {
				data: [],
			}
		})

	cmsLogger.debug('Existing ignore rules: %o', existing)

	if (existing?.data && existing.data.length > 0) {
		return false
	}

	await cms
		.items('fus_bot_ignore_rules')
		.createOne({
			user_id: id,
		})
		.catch((error) => {
			cmsLogger.error('Failed to create ignore rule for id %s. %o', id, error)
		})

	return true
}
