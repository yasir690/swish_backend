import AWS from "aws-sdk";

import fs from "fs";

import path from "path";
// AWS S3 Bucket Config
const s3 = new AWS.S3({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
});

//Upload file to S3

export const uploadFile = async (fileName) => {
  // Read content from the file
  const fileContent = fs.readFileSync(path.join(__dirname, fileName));

  console.log(fileContent);

  //setting up S3 upload parameters

  const params = {
    Bucket: process.env.Bucket,
    Key: fileName, // File name you want to save as in S3
    Body: fileContent,
  };

  // Uploading files to the bucket
  s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });
};

// Upload File to S3 Folder With Folder Name

export const uploadFileWithFolder = async (
  fileName,
  folderName,
  fileContent
) => {
  // Read content from the file
  // const fileContent = fs.readFileSync(path.join("public", "uploads", fileName));
  // Setting up S3 upload parameters
  const params = {
    Bucket: process.env.Bucket,
    Key: `${folderName}/${fileName}`, // File name you want to save as in S3
    Body: fileContent,
  };

  // Uploading files to the bucket
  const data = await s3.upload(params).promise();
  console.log(data);
  return data.Location;
};
