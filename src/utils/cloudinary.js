import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
    try{
        if (!localFilePath) return null
        //upload image to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        }); 
        // uploded 
        console.log("file uploaded to cloudinary successfully", response.url);
        return response;
     }
    catch(eroor){
        fs.unlinkSync(localFilePath)
        return null;

    }  
}