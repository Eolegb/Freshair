import { ServerClient } from "postmark"

export const postmark = process.env.POSTMARK_API_TOKEN
	? new ServerClient(process.env.POSTMARK_API_TOKEN)
	: (null as unknown as ServerClient)

export const FROM_EMAIL = "contact@bjornpagen.com" // Replace with your verified sender signature
