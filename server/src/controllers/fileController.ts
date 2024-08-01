import { Request, Response } from 'express'
import * as fs from 'fs/promises'
import path from 'path'

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, symbol, description } = req.body
    console.log(name, symbol, description)

    if (!req.file) {
      res.status(400).json({ message: 'File is required' })
      return
    }
    const filePath = path.resolve(req.file.path)
    console.log(`filePath`, filePath)
    const data = await fs.readFile(filePath)
    console.log(`data`, data)

    const response = await fetch('https://api.akord.com/files', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Api-Key': process.env.API_KEY!,
        'Content-Type': 'jpeg',
      },
      body: data,
    })
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`)
    }
    const responseData = await response.json()
    console.log('File uploaded successfully:', responseData)
    const imageUri = responseData.tx.gatewayUrls[1]
    const metaData = {
      name: name,
      symbol: symbol,
      description: description,
      image: imageUri,
    }
    const metaDataJson = JSON.stringify(metaData)
    console.log(`metaData is`, metaDataJson)
    const metaDataResponse = await fetch('https://api.akord.com/files', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Api-Key': process.env.API_KEY!,
        'Content-Type': 'json',
      },
      body: metaDataJson,
    })
    if (!metaDataResponse.ok) {
      throw new Error(`Failed to upload file: ${metaDataResponse.statusText}`)
    }
    const responseJsonResult = await metaDataResponse.json()
    console.log(`responseJson`, responseJsonResult)
    res.status(200).json({
      success: true,
      message: 'Metadata uploaded successfully',
      data: metaDataResponse,
    })
  } catch (err) {
    console.error('Error uploading file:', err)
    res.status(500).json({ message: (err as Error).message })
  }
}
