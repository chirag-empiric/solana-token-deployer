const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req: Request, file: any, cb: any) {
        cb(null, 'public/')
    },
    filename: function (req: Request, file: any, cb: any) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const fileData = file.originalname.split('.');
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + fileData[fileData.length - 1])
    }
});
export const fileUpload = multer({ storage: storage });