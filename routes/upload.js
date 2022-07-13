const fs = require('fs');
const AWS = require('aws-sdk');

/*const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
});

const uploadFile = (fileName) => {
    const fileContent = fs.readFileSync(fileName);

    const params = {
        Bucket: "fitness-frontend",
        Key: 'cat.jpg', // File name you want to save as in S3
        Body: fileContent
    };

    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log("File uploaded successfully. ${data.Location}");
    });
};

uploadFile('cat.jpg');*/