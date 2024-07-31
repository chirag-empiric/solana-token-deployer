import * as fs from 'fs/promises';

async function uploadFile() {
    try {
        const filePath = '/home/hp/Solana-tutorials/upload-arweave/sample2.txt';

        console.log(`filePath is`, filePath)

        // return

        const data: string = await fs.readFile(filePath, 'utf8');

        const response: Response = await fetch('https://api.akord.com/files', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Api-Key': "QizBVNmw5u6BnYV7mNhhqaIPuvn1P2ViMw3sDLVe",
                'Content-Type': 'text/plain'
            },
            body: data
        });

        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('File uploaded successfully:', responseData);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}

uploadFile();
