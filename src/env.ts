import { z } from 'zod'

export const cmsEnv = z
	.object({
		CMS_URL: z.string().url(),
		CMS_EMAIL: z.string().email(),
		CMS_PASSWORD: z.string().min(1),
	})
	.parse(process.env)

export const twitterEnv = z
	.object({
		CONSUMER_KEY: z.string().min(1),
		CONSUMER_SECRET: z.string().min(1),
		ACCESS_TOKEN_KEY: z.string().min(1),
		ACCESS_TOKEN_SECRET: z.string().min(1),

		OWNER_ID: z.string().min(1),
	})
	.parse(process.env)
