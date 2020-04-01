// 很多功能还没实现，也不符合Promise A+规范，后续会完善
function Promise(fun) {
  this.resolves = [];
  this.rejects = [];
  this.status = 'pending'
  let _this = this;
  function resolve(param) {
    _this.status = 'reslove'
    _this.resolves.forEach(item => {
      item(param);
    });
  };
  function reject(param) {
    _this.status = 'reject'
    _this.rejects.forEach(item => {
      item(param);
    });
  };
  fun(resolve, reject);
}
Promise.prototype.then = function(resolveFuc, rejectFuc) {
  if (resolveFuc) {
    this.resolves.push(resolveFuc);
  }
  if (rejectFuc) {
    this.rejects.push(rejectFuc);
  }
};
Promise.all = function(promiseArr) {
  let proNum = promiseArr.length
  return new Promise(function(resolve, reject){
    let resultArr = []
    promiseArr.forEach((pro,i) => {
      pro.then(data => {
        resultArr.push(data)
        if (i === proNum - 1){
          resolve(resultArr)
        }
      }, data=> {
        reject()
      })
    })
  })
};


let pro = new Promise(function(resolve, reject) {
  setTimeout(function() {
    resolve(1);
  }, 1000);
});
let pro2 = new Promise(function(resolve, reject) {
  setTimeout(function() {
    resolve(2);
  }, 2000);
});

pro.then(data => {
  console.log('pro1', data)
})

Promise.all([pro, pro2]).then(data => {
  console.log(data)
})
