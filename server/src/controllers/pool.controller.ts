
import { Request, Response } from 'express'

export const createPool = async (req: Request, res: Response): Promise<void> => {
    try {
        // some code thing
        res.status(200).json({
            success: true,
            message: 'LP Created successfully',
        })
    } catch (err) {
        console.error('Error uploading file:', err)
        res.status(500).json({ message: (err as Error).message })
    }
}