import pool from "../configs/connectDatabse";
import auth from "../middleware/auth";

//Xem đơn đặt hàng
//note ý tưởng
//insert into order_detail(id_product,mount) values(?,?) where id_account=token
//Thêm từng cái và xóa từng cái
let insertOrder = (id_account, discount_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let order = await pool.execute(
        "insert into orders(id_account,status,discount_id) values(?,1,?)",
        [id_account, discount_id]
      );
      let [check] = await pool.execute(
        "SELECT * FROM orders ORDER BY id_order DESC LIMIT 1"
      );
      if (check[0].id_account != id_account) {
        resolve("Đơn hàng trống");
      } else {
        resolve(check[0]);
      }
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

let listDetailOrder = (id_order, id_account) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [listDetail] = await pool.execute(
        "select id_order,p.id_product,quantity,name_product,price from cart c,orders o,product p where c.id_account = o.id_account and p.id_product = c.id_product and o.status=1 and c.id_account=? and id_order=?",
        [id_account, id_order]
      );
      if (!listDetail[0]) {
        resolve(false);
      } else {
        resolve(listDetail);
      }
    } catch (err) {
      reject(err);
    }
  });
};

let insertDetailOrder = (id_order, id_product, quantity, price, size) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [insert] = await pool.execute(
        "insert into order_detail(id_order,id_product,amount,price,size) values(?,?,?,?,?)",
        [id_order, id_product, quantity, price, size]
      );
      console.log(">>> check insert: ", insert);
      resolve(insert);
    } catch (err) {
      reject(err);
    }
  });
};

let deleteCart = (id_account, id_product) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Id_account: ", id_account);
      console.log("Id_product:", id_product);
      let [del] = await pool.execute(
        "delete from cart where id_account=? and id_product=?",
        [id_account, id_product]
      );
      resolve(del);
    } catch (err) {
      reject(err);
    }
  });
};
let checkCart = (id_account) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [check] = await pool.execute(
        "select * from cart where id_account=? ",
        [id_account]
      );
      if (!check[0]) {
        resolve(false);
      } else {
        resolve(true);
      }
    } catch (err) {
      reject(err);
    }
  });
};

let getOrder = async (req, res) => {
  let id_account = auth.tokenData(req).id_account;

  let check = await checkCart(id_account);
  if (check) {
    let insert = await insertOrder(id_account);
    let id_order = insert.id_order;
    let listDetails = await listDetailOrder(id_order, id_account);

    console.log("Id_order:", id_order);
    console.log(">>Check list detail: ", listDetails);
    if (listDetails) {
      for (let i in listDetails) {
        //(id_order, id_product, quantity, name, price)
        let insert = await insertDetailOrder(
          id_order,
          listDetails[i].id_product,
          listDetails[i].quantity,
          listDetails[i].name_product,
          listDetails[i].price
        );
        // (id_account, id_product)
        let del = await deleteCart(id_account, listDetails[i].id_product);
      }
    } else {
      return res.status(400).json({
        message: "Đặt hàng thất bại!",
      });
    }
  } else {
    return res.status(400).json({
      message: "Giỏ hàng của bạn trống nên không thể đặt hàng!",
    });
  }
  return res.status(200).json({
    orders: "Đặt hàng thành công!",
  });
};

//Xem chi tiết đơn đặt hàng
let selectIdOrder = (id_account) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [idOrder] = await pool.execute(
        "select id_order from orders where id_account=?",
        [id_account]
      );
      if (!idOrder[0]) {
        resolve(false);
      } else {
        resolve(idOrder[0].id_order);
        console.log(idOrder[0]);
      }
    } catch (err) {
      reject(err);
    }
  });
};

let detail = (id_order) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [detail] = await pool.execute(
        // "select * from order_detail where id_order=?",
        // [id_order]
        ` SELECT *,
        temp_result.price AS gia,
        temp_result.size AS order_size
  FROM (SELECT 
           a.id_order,
       a.id_product,
       a.amount,
        a.price AS price,
         a.size AS size,   	 
       b.order_time,
       b.id_account,
       b.status,
       b.discount_id,
       c.name_product,
       c.detail,
       c.images,
        d.name,
        d.address,
       d.phone
       FROM order_detail a
       JOIN orders b ON a.id_order = b.id_order
       JOIN product c ON a.id_product = c.id_product
       JOIN account d ON d.id_account=b.id_account
       WHERE a.id_order=?
       ORDER BY b.order_time DESC) AS temp_result left join discount e on temp_result.discount_id= e.discount_id`,
        [id_order]
      );
      console.log(detail[0]);
      if (!detail) {
        resolve("Chi tiết đơn hàng không tồn tại");
      } else {
        resolve(detail);
      }
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

let getDetailOrder = async (req, res) => {
  //let id_account = auth.tokenData(req).id_account
  let { id_order } = req.params;
  //let details = await detail(id_order)
  let details = await detail(id_order);
  console.log(details);
  let total = 0;
  details.map((item, index) => {
    total += item.amount * item.price;
  });
  console.log("tổng: ", total);
  return res.status(200).json({
    // detailOrder: details
    listOrderDetail: details,
    total,
  });
};

let getOrderNew = async (req, res) => {
  try {
    let [order] = await pool.execute(
      "SELECT * from account a,orders o where a.id_account=o.id_account order by o.order_time DESC"
    );
    return res.status(200).json({
      listOrder: order,
    });
  } catch (e) {
    console.log(e);
  }
};

let xacNhanDonHang = (req, res) => {
  try {
    let id_order = req.params.id_order;
    let update = pool.execute(
      "UPDATE orders SET status = 2 WHERE id_order = ?",
      [id_order]
    );
    return res.status(200).json({
      errCode: 0,
      message: "Đơn hàng đã được xác nhận",
    });
  } catch (e) {
    console.log(e);
  }
};

let hoanThanhDonHang = async (req, res) => {
  try {
    //let id_account = auth.tokenData(req).id_account
    let { id_order } = req.params;
    //let details = await detail(id_order)
    let details = await detail(id_order);
    console.log(details);
    let total = 0;
    details.map((item, index) => {
      total += item.amount * item.price;
    });
    console.log("tổng: ", total);
    //('insert into orders(id_account,status) values(?,1)', [id_account])
    let updatedoanhthu = pool.execute(
      "insert into doanhthu(id_order,total) values(?,?)",
      [id_order, total]
    );
    let update = pool.execute(
      "UPDATE orders SET status = 0 WHERE id_order = ?",
      [id_order]
    );
    return res.status(200).json({
      // detailOrder: details
      total,
      errCode: 0,
      message: "Đơn hàng đã hoàn thành",
    });
  } catch (e) {
    console.log(e);
  }
};

let huyDonHang = (req, res) => {
  try {
    let id_order = req.params.id_order;
    let update = pool.execute(
      "UPDATE orders SET status = 3 WHERE id_order = ?",
      [id_order]
    );
    return res.status(200).json({
      errCode: 0,
      message: "Đơn hàng đã được hủy",
    });
  } catch (e) {
    console.log(e);
  }
};

let xemDoanhSo = async (req, res) => {
  //let details = await detail(id_order)
  console.log("HEllo");
  // let [listDoanhSo] = await pool.execute('SELECT * FROM doanhthu d,orders o where d.id_order=o.id_order')
  let [listDoanhSo] = await pool.execute(
    "SELECT DATE(order_time) as ngay,sum(total) as total_doanhso FROM orders o,doanhthu d where o.id_order=d.id_order GROUP BY DATE(order_time)"
  );
  console.log(listDoanhSo);
  return res.status(200).json({
    // detailOrder: details
    listDoanhSo: listDoanhSo,
  });
};

let datHangNew = async (req, res) => {
  let id_account = auth.tokenData(req).id_account;
  let arr = req.body.arr;
  let id_discount = req.body.id_discount || null;
  let check = await checkCart(id_account);
  if (check) {
    let insert = await insertOrder(id_account, id_discount);
    let id_order = insert.id_order;
    let listDetails = await listDetailOrder(id_order, id_account); //list cart giỏ

    console.log("Id_order:", id_order);
    console.log(">>Check list detail: ", arr);
    if (arr) {
      for (let i in arr) {
        //(id_order, id_product, quantity, name, price, size)
        console.log(
          id_order,
          arr[i].id_product,
          arr[i].quantity,
          // arr[i].name_product,
          arr[i].price,
          arr[i].size
        );
        let insert = await insertDetailOrder(
          id_order,
          arr[i].id_product,
          arr[i].quantity,
          // arr[i].name_product,
          arr[i].price,
          arr[i].size
        );
        // (id_account, id_product)
        console.log(insert);
      }
      for (let i in listDetails) {
        let del = await deleteCart(id_account, listDetails[i].id_product);
      }
      // console.log(arr, 'Và:', listDetails);
    } else {
      return res.status(400).json({
        message: "Đặt hàng thất bại!",
      });
    }
  } else {
    return res.status(400).json({
      message: "Giỏ hàng của bạn trống nên không thể đặt hàng!",
    });
  }
  return res.status(200).json({
    orders: "Đặt hàng thành công!",
  });
};

let orderHistory = async (req, res) => {
  try {
    let id_account = req.params.id_account;
    let status = req.params.status;
    console.log(id_account);
    let [response] = await pool.execute(
      `SELECT *,
      temp_result.price AS gia,
      temp_result.size AS order_size
FROM (SELECT 
         a.id_order,
     a.id_product,
     a.amount,
      a.price AS price,
       a.size AS size,   	 
     b.order_time,
     b.id_account,
     b.status,
     b.discount_id,
     c.name_product,
     c.detail,
     c.images
     FROM order_detail a
     JOIN orders b ON a.id_order = b.id_order
     JOIN product c ON a.id_product = c.id_product

     WHERE id_account =? AND b.status = ?
     ORDER BY b.order_time DESC) AS temp_result left join discount d on  temp_result.discount_id= d.discount_id`,
      [id_account, status]
    );
    return res.status(200).json({
      listOrder: response,
    });
  } catch (e) {
    console.log(e);
  }
};
let orderAccount = async (req, res) => {
  try {
    let id_account = req.params.id_account;
    console.log(id_account);
    let [response] = await pool.execute(
      "SELECT * FROM orders WHERE id_account=?",
      [id_account]
    );
    return res.status(200).json({
      listOrder: response,
    });
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  getOrder,
  getDetailOrder,
  detail,
  getOrderNew,
  xacNhanDonHang,
  hoanThanhDonHang,
  huyDonHang,
  xemDoanhSo,
  datHangNew,
  orderHistory,
  orderAccount,
};
