const { GoogleGenerativeAI } = require("@google/generative-ai");

// PASTE YOUR KEY HERE
const API_KEY = "YOUR_API_KEY_HERE"; 

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Placeholder
    console.log("Checking API access...");
    
    // This command asks Google: "What models can I use?"
    // We have to rely on the library internals or just try a basic fetch if the SDK doesn't expose list_models easily in this version.
    // Actually, let's try a direct test of the most likely candidate:
    
    console.log("Attempting connection with: gemini-1.5-flash-001");
    const modelSpecific = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
    const result = await modelSpecific.generateContent("Hello?");
    console.log("SUCCESS! Model is: gemini-1.5-flash-001");
    console.log("Response:", result.response.text());
    
  } catch (error) {
    console.log("\n--- CONNECTION FAILED ---");
    console.error(error.message);
    
    // If that fails, let's try the fallback:
    try {
        console.log("\nAttempting connection with: gemini-pro");
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        await modelPro.generateContent("Hello?");
        console.log("SUCCESS! Model is: gemini-pro");
    } catch (e2) {
        console.log("gemini-pro failed too.");
    }
  }
}

listModels();