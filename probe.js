// probe.js - The Model Scanner
const API_KEY = "AIzaSyApC0lG5SQF5KC1jNYojzjVcn2RD8Wp-xU"; 

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log("Scanning Google Neural Network...");

async function scan() {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error("ACCESS DENIED:", data.error.message);
    } else {
        console.log("\n=== AUTHORIZED MODELS ===");
        // We only want models that support 'generateContent'
        const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        
        chatModels.forEach(model => {
            // Print the clean name
            console.log(`"${model.name.replace("models/", "")}"`);
        });
        console.log("=========================");
    }
  } catch (error) {
    console.error("CONNECTION ERROR:", error.message);
  }
}

scan();