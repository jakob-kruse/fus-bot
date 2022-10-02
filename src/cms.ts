import { Directus } from '@directus/sdk'
import { cmsEnv } from './env'
import { TwitterStreamParams } from './types'

export type CMSTypeMap = {
	fus_bot_ignore_rules: {
		id: number
		status: 'published' | 'draft' | 'archived'
		screen_name: string | null
		regex: string | null
		contains: 'string | null '
	}
	fus_bot_parameters: TwitterStreamParams
}

export const cms: Directus<CMSTypeMap> = new Directus<CMSTypeMap>(cmsEnv.CMS_URL)

export async function ensureAuth() {
	let isAuth = false
	await cms.auth
		.refresh()
		.then(() => {
			isAuth = true
		})
		.catch(() => {})

	if (!isAuth) {
		await cms.auth.login({
			email: cmsEnv.CMS_EMAIL,
			password: cmsEnv.CMS_PASSWORD,
		})
	}
}

export async function getIgnoreRules() {
	await ensureAuth()

	const cmsResponse = await cms.items('fus_bot_ignore_rules').readByQuery({})

	return cmsResponse.data?.filter((rule) => !!rule) as CMSTypeMap['fus_bot_ignore_rules'][]
}

export async function getStreamParams() {
	await ensureAuth()

	const cmsResponse = await cms.items('fus_bot_parameters').readByQuery({
		fields: '*.*',
	})

	return cmsResponse.data as TwitterStreamParams
}
