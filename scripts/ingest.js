import { ChromaClient } from "chromadb";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import cliProgress from "cli-progress";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { loadCodeFiles } from "../utils/codeLoader.js";

const REPO_PATH = "/Users/t830373/Desktop/Spark Projects/online-web-shop/src";
const CHROMA_URL = "http://localhost:8000";
const COLLECTION_NAME = "online-web-shop";
const BATCH_SIZE = 50;


try {
    const chromaClient = new ChromaClient({ path: CHROMA_URL });
    const collections = await chromaClient.listCollections();
    const existingCollection = collections.find(
        (col) => col.name === COLLECTION_NAME
    );
    if (existingCollection) {
        console.log(`Collection "${COLLECTION_NAME}" existed，deleting...`);
        await chromaClient.deleteCollection({name:COLLECTION_NAME});
        console.log(`Collection "${COLLECTION_NAME}" deleted。`);
    }
    const rawDocs = await loadCodeFiles(REPO_PATH);

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\n\n", "\n"]
    });
    const documents = await textSplitter.splitDocuments(rawDocs);

    const embeddings = new HuggingFaceTransformersEmbeddings({
        model: "Xenova/all-MiniLM-L6-v2",
    });
   
    await insertDocumentsWithProgress(documents, embeddings, COLLECTION_NAME, CHROMA_URL);

    console.log("Document ingestion completed.");
} catch (error) {
    console.error("Error ingesting code repository:", error);
}

async function insertDocumentsWithProgress(documents, embeddings, collectionName, chromaUrl) {
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(documents.length, 0);

    const vectorStore = await Chroma.fromDocuments([], embeddings, {
        collectionName: collectionName,
        url: chromaUrl,
    });

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        await vectorStore.addDocuments(batch);
        progressBar.increment(batch.length);
    }

    progressBar.stop();
}