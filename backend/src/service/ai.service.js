const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function generateResponse(chatHistory){
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatHistory,
    })


   return response.text;
}

module.exports= generateResponse