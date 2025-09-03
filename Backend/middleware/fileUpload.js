import multer from "multer";
import  MulterAzureStorage  from "multer-azure-storage";
const getAzureStorage = () => {
  return new MulterAzureStorage({
    azureStorageAccessKey: process.env.AZURE_STORAGE_ACCESS_KEY,
    azureStorageAccount: process.env.AZURE_STORAGE_ACCOUNT,
    containerName: 'user-uploads',
  });
};
const upload = multer({ storage: getAzureStorage() });
export default upload;