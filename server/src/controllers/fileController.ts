import { Request, Response } from 'express'
import * as fs from 'fs/promises'

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const filePath = '/home/hp/RustroverProjects/solana-token-deployer/server/dummy.jpg'
        // const filePath = process.env.FILE_PATH!
        const data: string = await fs.readFile(filePath, 'utf8');
        // const data = await fs.readFile(filePath, 'utf8')

        const response = await fetch('https://api.akord.com/files', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Api-Key': process.env.API_KEY!,
                'Content-Type': 'text/json'
            },
            body: data
        })
        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.statusText}`)
        }
        const responseData = await response.json()
        console.log('File uploaded successfully:', responseData)
        res.status(200).json(responseData)
    } catch (err) {
        console.error('Error uploading file:', err)
        res.status(500).json({ message: (err as Error).message })
    }
};
