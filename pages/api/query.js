import { Chroma } from '@langchain/community/vectorstores/chroma';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import { ChatOllama } from '@langchain/ollama';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const embeddings = new HuggingFaceTransformersEmbeddings({
      model: 'Xenova/all-MiniLM-L6-v2',
    });

    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: 'online-web-shop',
      url: 'http://localhost:8000',
    });

    const retriever = vectorStore.asRetriever({ search_kwargs: { k: 5 } });
    const relevantDocs = await retriever.invoke(message);

    const context = relevantDocs
      .map((doc) => `File: ${doc.metadata.source}\nContent: ${doc.pageContent}`)
      .join('\n\n');

    if (!context) {
      return res.status(404).json({ reply: 'No relevant code found.' });
    }

    const llm = new ChatOllama({
      model: 'llama3.2',
    });
    const prompt = `
You are a code understanding assistant. Answer the user's question based on the following code snippet.

=== Code Snippet ===
${context}

=== Question ===
${message}
Respond in clear and concise language, and briefly explain the code logic.
Should include necessary code snippets and explanations and the location of the code in the repository.
`;

    const response = await llm.invoke(prompt);

    res.status(200).json({ reply: response.content });
  } catch (error) {
    console.error('Error in query API:', error);
    res.status(500).json({ error: 'Failed to process query.' });
  }
}
