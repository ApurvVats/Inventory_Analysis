import { BlobServiceClient } from "@azure/storage-blob";
let client;
function getAzureBlobClient() {
  if (client) return client;  
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const key = process.env.AZURE_STORAGE_ACCESS_KEY;
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${account};AccountKey=${key};EndpointSuffix=core.windows.net`;
  if (!account || !key) {
    throw new Error("Azure Storage account name or access key is not configured.");
  }
  client = BlobServiceClient.fromConnectionString(connectionString);
  return client;
}
export async function getStreamFromBlob(fileUrl) {
    const client = getAzureBlobClient();
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/').filter(p => p);
    const containerName = pathParts[0];
    const blobName = pathParts.slice(1).join('/');
    const containerClient = client.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    const downloadResponse = await blobClient.download();
    if (!downloadResponse.readableStreamBody) {
        throw new Error(`Failed to get readable stream for blob: ${blobName}`);
    }  
    return downloadResponse.readableStreamBody;
}