// import pool from "../configs/connectDatabse"
// import pool from "../configs/connectDatabse";
import pool from "../configs/connectDatabse"
import multer from 'multer'

// let getHomepage = (req, res) => {
//     //logic
//     let data = []
//     pool.query(
//         'SELECT * FROM `users`',
//         function (err, results, fields) {
//             // console.log(results); // results contains rows returned by server
//             results.map((row) => {
//                 data.push({
//                     id: row.id,
//                     email: row.email,
//                     address: row.address,
//                     firstName: row.firstName,
//                     lastName: row.lastName
//                 })
//             })
//             // console.log(typeof (data), JSON.stringify(data));
//             return res.render('index.ejs', { dataUser: data })
//         }
//     );
// }

let getHomepage = async (req, res) => {


    const [rows, fields] = await pool.execute('SELECT * FROM `product`');
    // console.log(typeof (data), JSON.stringify(data));
    // return res.render('index.ejs', { dataUser: rows })
    res.render('account.ejs')

}

let getDetailpage = async (req, res) => {
    let userId = req.params.userId
    let [user] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
    return res.send(JSON.stringify(user))
}

let createNewUser = async (req, res) => {
    console.log(req.body);
    let { firstName, lastName, email, address } = req.body
    await pool.execute('insert into users (firstname,lastname,email,address) values (?,?,?,?)', [firstName, lastName, email, address])
    // return res.send('Chúc mừng bạn đã thêm thành công')
    return res.redirect('/')
}

let deleteUser = async (req, res) => {
    let userId = req.body.userId
    await pool.execute(`delete from users where id=?`, [userId])
    return res.redirect('/')
}

let getEditUser = async (req, res) => {
    let id = req.params.id
    let [user] = await pool.execute('select * from users where id=?', [id])
    return res.render('update.ejs', { dataUser: user[0] })
}

let updateUser = async (req, res) => {
    console.log(req.body);
    let { firstName, lastName, email, address, id } = req.body
    await pool.execute('update users set firstname=?,lastname=?,email=?,address=? where id=?', [firstName, lastName, email, address, id])
    return res.send('Đã UPDATE thành công')
}

let getUploadFile = async (req, res) => {
    return res.render('uploadfile.ejs')
}

//Mới

let handleUploadFile = async (req, res) => {
    // 'profile_pic' is the name of our file input field in the HTML form
    // req.file contains information of uploaded file
    // req.body contains information of text fields, if there were any

    if (req.fileValidationError) {
        return res.send(req.fileValidationError);
    }
    else if (!req.file) {
        return res.send('Please select an image to upload');
    }
    // else if (err instanceof multer.MulterError) {
    //     return res.send(err);
    // }
    // else if (err) {
    //     return res.send(err);
    // }

    // Display uploaded image for user validation
    res.send(`You have uploaded this image: <hr/><img src="/image/${req.file.filename}" width="500"><hr /><a href="./upload">Upload another image</a>`);
}

let handleUploadMultipleFile = (req, res) => {

    if (req.fileValidationError) {
        return res.send(req.fileValidationError);
    }
    else if (!req.files) {
        return res.send('Please select an image to upload');
    }
    // else if (err instanceof multer.MulterError) {
    //     return res.send(err);
    // }
    // else if (err) {
    //     return res.send(err);
    // }

    let result = "You have uploaded these images: <hr />";
    const files = req.files;
    console.log('>>>>Check file: ', files);
    let index, len;

    // Loop through all the uploaded images and display them on frontend
    for (index = 0, len = files.length; index < len; ++index) {
        result += `<img src="/image/${files[index].filename}" width="300" style="margin-right: 20px;">`;
    }
    result += '<hr/><a href="./upload">Upload more images</a>';
    res.send(result);
}


module.exports = {
    getHomepage,
    getDetailpage,
    createNewUser,
    deleteUser,
    getEditUser,
    updateUser,
    getUploadFile,
    handleUploadFile,
    handleUploadMultipleFile
    // homeController
}