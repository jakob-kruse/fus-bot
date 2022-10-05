import { Directus } from '@directus/sdk'
import { cmsEnv } from './env'
import { logger } from './logger'
import { TwitterStreamParams } from './types'

const cmsLogger = logger.child({ module: 'cms' })

export type CMSTypeMap = {
	fus_bot_ignore_rules: {
		id: number
		status: 'published' | 'draft' | 'archived'
		screen_name: string | null
		screen_name_regex: string | null
		regex: string | null
		contains: 'string | null '
	}
	fus_bot_parameters: TwitterStreamParams
}

export const cms: Directus<CMSTypeMap> = new Directus<CMSTypeMap>(cmsEnv.CMS_URL)

export async function ensureAuth() {
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
