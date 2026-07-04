const {GoogleGenAI} = require("@google/genai")

const ai = new GoogleGenAI({})

async function genrateResponse(content){
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents : content,
        config : {
            temperature : 0.7, /* 0<=n=>2 */
            
        }
    })

    return response.text

}

async function generateVector(content){

    const response = await ai.models.embedContent({
        model : "gemini-embedding-001",
        contents: content,
        config:{
            outputDimensionality : 768
        }
    })
    return response.embeddings[0].values

}

module.exports = {genrateResponse,generateVector}