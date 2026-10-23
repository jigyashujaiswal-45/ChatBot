
require("dotenv").config();

const app = require("./src/app");
const { createServer } = require("http");
const { Server } = require("socket.io");
const generateResponse = require("./src/service/ai.service");
const { FunctionResponse, FunctionResponsePart } = require("@google/genai");

const httpServer = createServer(app);
const frontendOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim());
const io = new Server(httpServer, {
    cors: { origin: frontendOrigins },
});

//short term memory.
const chatHistory = [
    {
        role:"user",
        parts:[
            { 
                text: "who was the PM of INDIA in 2019 ?"
             }
        ]
    },
    {
        role: "model",
        parts: [
            {
                text:"The Prime Minister of India in 2019 was **Narendra Modi**."
            }
               ]
    }
]

io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });

   
socket.on("ai-message", async (data) => {
    try {
        console.log("Received data:", data);

        const prompt =
            typeof data === "string" ? data : data?.prompt;

        if (!prompt) {
            console.log("Prompt missing!");
            return;
        }

        //store user's actual question
           chatHistory.push({
            role: "user",
            parts: [ { text: prompt } ]
        });


        const response = await generateResponse(chatHistory);
         
        //store AI answer
        chatHistory.push({
            role: "model",
            parts: [ { text: response } ]
        });

        console.log("AI Response:", response);

        socket.emit("ai-message-response", { response });

    } catch (error) {
        console.error("AI Error:", error.message);

        socket.emit("ai-message-response", {
            error: "Failed to generate AI response"
        });
    }
});

});

httpServer.listen(3000, () => {
    console.log("Server is running on port 3000");
});
