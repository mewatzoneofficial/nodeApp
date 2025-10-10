const db = require('./db');
// const adminDB = require('../db/adminDB')

// exports.runQuery = async (q, params = []) => {
//     try {
//         return new Promise((resolve, reject) => {
//             db.query(q, params, (err, result) => {
//                 if (!err) {
//                     resolve(result)
//                 } else {
//                     reject(err)
//                 }
//             })
//         })
//     } catch (error) {
//         throw new Error(err);
//     }
// }

exports.runQuery = async (q, params = []) => {
    return new Promise((resolve, reject) => {
        db.getConnection((err, connection) => {   // get a connection from pool
            if (err) return reject(err);
            connection.query(q, params, (err, result) => {
                connection.release();             // release connection to pool
                if (err) return reject(err);
                resolve(result);
            });
        });
    });
};


// exports.runAdminQuery = async(q,params=[])=>{
//     try {
//         return new Promise((resolve, reject) => {
//             adminDB.query(q, params, (err, result) => {
//                 if (!err) {
//                     resolve(result)
//                 } else {
//                     reject(err)
//                 }
//             })
//         })
//     } catch (error) {
//         throw new Error(err);
//     }
// }