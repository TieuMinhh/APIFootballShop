import pool from "../configs/connectDatabse";
import userService from "../services/userService";
import mail from "../services/mail";
import UserController from "./UserController";
import bcrypt from "bcryptjs";
import { createJWTTest } from "../middleware/JWTAction";

let getIdAccountOfEmail = (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [id_account] = await pool.execute(
        "select id_account from account where email=?",
        [email]
      );
      resolve(id_account[0].id_account);
    } catch (err) {
      reject(err);
    }
  });
};

let insertVerification = (id_account, code) => {
  return new Promise(async (resolve, reject) => {
    try {
      //let check = {}
      console.log(">>>>>>>>>>Check id_account 2: ", id_account);
      let [row] = await pool.execute(
        "insert into verification(id_account,code) values(?,?)",
        [id_account, code]
      );
      let [id_ver] = await pool.execute(
        "select id_verification from verification where id_account=?",
        [id_account]
      );
      console.log(">>>>>>>>CHECK:  ", id_ver[0].id_verification);
      let id_verification = id_ver[0].id_verification;
      //check.exist = row[0].id_verification
      //check.exist = id_ver
      resolve(id_verification);
    } catch (error) {
      reject(error);
    }
  });
};

let deleteCode = (id_verification) => {
  return new Promise(async (resolve, reject) => {
    try {
      let del = await pool.execute(
        "delete from verification where id_verification=?",
        [id_verification]
      );
      resolve(del);
    } catch (err) {
      reject(err);
    }
  });
};

let autoDeleteCode = (id_verification) => {
  setTimeout(deleteCode, 60000, id_verification);
};

let forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(401).json({
        message: "Vui lòng nhập email!",
      });
    }

    let exist = await userService.checkUserEmail(email);
    console.log(">>>Check exist: ", exist);

    if (exist) {
      //Tạo 1 mã code gồm 6 số
      let code = mail.createCode();

      //Lấy id_account của email
      let id_account = await getIdAccountOfEmail(email);
      console.log(">>>>Check id_Account: ", id_account);
      //Gửi mail đi
      mail.sendVerification(email, code);

      code = await UserController.hashUserPassword(code);
      console.log(">>>>>>>>>>>>>>>Check code :", code);

      let id_verification = await insertVerification(id_account, code);
      // console.log(id_verification);
      //Xóa mã code trong db
      autoDeleteCode(id_verification);
      return res.status(200).json({
        errCode: 0,
        id_account: id_account,
        message: "Đã gửi mã xác nhận đến email của bạn",
      });
    } else {
      return res.status(200).json({
        errCode: 1,
        message: "Tài khoản không tồn tại trong hệ thống",
      });
    }
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
};

//Xác nhận mã (hiệu lực trong 60 giây)
let selectAccount = (id_account) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = {};
      let [exist] = await pool.execute(
        "select * from account where id_account=?",
        [id_account]
      );
      data = { ...exist[0] };
      delete data["password"];
      resolve(data);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};

let checkVerification = (id_account) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [exist] = await pool.execute(
        "select * from verification where id_account=?",
        [id_account]
      );
      console.log("Test !exist: ", !exist[0]);
      console.log("Test exist:", exist[0]);
      if (!exist[0]) {
        //undefined !undefined =>true true
        resolve(false);
      } else {
        resolve(exist[0].code);
      }
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};

let confirm = async (req, res) => {
  try {
    let { code } = req.body;
    let { id_account } = req.params;

    console.log("Tham so truyen vao: ", code, id_account);
    if (!code || !id_account) {
      return res.status(200).json({
        message: "Không được bỏ trống",
      });
    }

    //Kiểm tra tồn tại mã xác nhận
    let exist = await checkVerification(id_account, code);
    if (!exist) {
      return res.status(200).json({
        errCode: 1,
        message: "Mã xác minh hết hiệu lực",
      });
    } else {
      // return res.status(200).json({
      //     errCode: 0,
      //     message: 'Thàn công rồi'
      // })
      console.log(">>>>>>>>Check password 1 :  ", code, exist);
      let checkPassword = bcrypt.compareSync(code, exist);
      console.log(">>>>>>>>Check password:  ", checkPassword);
      if (checkPassword) {
        let data = await selectAccount(id_account);

        let accsessToken = createJWTTest(data);
        console.log(">>>>>>>>Check password 2 :  ", accsessToken);
        return res.status(200).json({
          errCode: 0,
          message: "Thành công! Bạn hãy nhập mật khẩu mới",
          id_account: id_account,
        });
      } else {
        return res.status(500).json({
          message: "Sai password",
        });
      }
    }
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
};

module.exports = {
  forgotPassword,
  confirm,
};
