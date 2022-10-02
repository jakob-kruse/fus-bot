import Twitter from 'twitter-lite'
import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'

const env = z
	.object({
		CONSUMER_KEY: z.string().min(1),
		CONSUMER_SECRET: z.string().min(1),
		ACCESS_TOKEN_KEY: z.string().min(1),
		ACCESS_TOKEN_SECRET: z.string().min(1),

		OWNER_ID: z.string().min(1),

		IGNORED_WORDS_PATH: z.string().default('ignored_words.txt'),
		IGNORED_USERS_PATH: z.string().default('ignored_users.txt'),
	})
	.parse(process.env)

const client = new Twitter({
	consumer_key: env.CONSUMER_KEY!,
	consumer_secret: env.CONSUMER_SECRET!,
	access_token_key: env.ACCESS_TOKEN_KEY!,
	access_token_secret: env.ACCESS_TOKEN_SECRET!,
})

const parameters = {
	track: 'fus,füse, füsen, #fusfreitag, fuß, füße, füßen',
	language: 'de,us',
}

console.log(`Running Stream with parameters: ${JSON.stringify(parameters)}`)

async function readLinesFromFile(path: string, def?: string[]) {
	try {
		const ignoredWords = await fs.readFile(path, 'utf-8')
		return ignoredWords
			.split('\n')
			.map((word) => word.toLowerCase().trim())
			.filter((word) => word.length > 0)
	} catch (error) {
		console.log(`Could not read file ${path}. Using default value.`)

		return def ?? []
	}
}

async function startStream() {
	const ignoredWords = await readLinesFromFile(
		path.resolve(process.cwd(), env.IGNORED_WORDS_PATH),
		[]
	)
	const ignoredUsers = await readLinesFromFile(
		path.resolve(process.cwd(), env.IGNORED_USERS_PATH),
		[]
	)

	console.log(`Ignoring words: ${ignoredWords.join(', ')}`)
	console.log(`Ignoring users: ${ignoredUsers.join(', ')}`)

	client
		.stream('statuses/filter', parameters)
		.on('data', (tweet) => {
			if (tweet.user.id_st !== process.env.OWNER_ID && !tweet.retweeted_status) {
				console.log(`Got new tweet...`)
				const tweetURL = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`

				if (ignoredWords.some((word) => tweet.text.toLowerCase().includes(word))) {
					console.log(`Ignoring tweet by word. ${tweetURL}`)
				} else if (ignoredUsers.includes(tweet.user.screen_name)) {
					console.log(`Ignoring tweet by user. ${tweetURL}`)
				} else {
					console.log(`Retweeting tweet ${tweetURL}`)

					client.post(`statuses/retweet/${tweet.id_str}`, {}).catch(console.error)
				}
			}
		})
		.on('ping', () => console.log('ping'))
		.on('error', (error) => console.error('error', error))
		.on('end', () => {
			setTimeout(() => startStream(), 20000)
		})
}

startStream()
