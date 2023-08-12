import express from "express";

import homeController from "../controller/homeController"

import multer from 'multer'

import path from 'path'

import appRoot from 'app-root-path'

//userController
import userController from "../controller/UserController"
let router = express.Router();

const storage = multer.diskStorage({
    destination: "./src/public/image/",
    filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});

const upload = multer({
    storage: storage
})
const initWebRouter = (app) => {
    router.get('/', homeController.getHomepage);

    router.get('/detail/user/:userId', homeController.getDetailpage)

    router.post('/create-user-new', homeController.createNewUser)

    router.get('/edit-user/:id', homeController.getEditUser)

    router.post('/delete-user', homeController.deleteUser)

    router.post('/update-user', homeController.updateUser)

    router.get('/upload', homeController.getUploadFile)
    router.post('/upload-profile-pic', upload.single('profile_pic'), homeController.handleUploadFile)
    router.post('/upload-multiple-images', (req, res, next) => {
        uploadMultipleFiles(req, res, (err) => {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
                res.send('ĐÃ VƯỢT QUÁ GIỚI HẠN CHO PHÉP')
            } else if (err) {
                res.send(err)
            }
            else {
                next()
            }
        })
    }, homeController.handleUploadMultipleFile)


    // router.get('/findone', userController.findOneEmail)
    router.get('/phong', (req, res) => {
        res.sendFile('account.html')
    })

    return app.use('/', router)
}

export default initWebRouter