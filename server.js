import express from "express";
import { PromptTemplate } from "langchain/prompts";
import { SerpAPI, WikipediaQueryRun } from "langchain/tools";
import { OpenAI } from "langchain/llms/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

import "dotenv/config";

const app = express();
const PORT = 3000;

const question = {
	overview: "Give a 100 word general summary of {name}'s career",
	voting: "Give ageneral overview of {name}'s voting history",
	immigration: "What is {name}'s stance on immigration",
	eu: "What is {name}'s stance on the EU",
	socialMedia: "Find links to {name}'s social media accounts",
	rightWing: "On a scale of 0 to 100 how right wing is {name}",
	leftWing: "On a scale of 0 to 100 how left wing is {name}",
	news: "Give a summary of news articles {name} has been in in the last six months",
};

const model = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	temperature: 0.1,
	maxTokens: 200,
});

const tools = [
	new SerpAPI(process.env.SERPAPI_API_KEY, {
		location: "London, United Kingdom",
		hl: "en",
		gl: "uk",
	}),
	new WikipediaQueryRun(),
];

const executor = await initializeAgentExecutorWithOptions(tools, model, {
	agentType: "zero-shot-react-description",
	verbose: true,
});

app.get("/ai_mp_data", async (req, res) => {
	const urlName = req.query.name;
	const urlQuestion = req.query.question;
	if (urlName && question && question.hasOwnProperty(urlQuestion)) {
		const promptTemplate = PromptTemplate.fromTemplate(
			question[urlQuestion]
		);
		const input = await promptTemplate.format({ name: urlName });
		const result = await executor.call({
			input,
		});

		res.send(result);
	} else {
		res.send("Sorry your query isn't formatted correctly");
	}
});

app.listen(process.env.PORT || PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
