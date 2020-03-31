function Promise(fun) {
  this.resolves = []
  this.rejects = []
  let _this = this
  this.then = function (resolveFuc, rejectFuc) {
    if (resolveFuc) {
      _this.resolves.push(resolveFuc)
    } 
    if (rejectFuc) {
      _this.rejects.push(rejectFuc)
    }
  }
  let resolve = function(param){
    _this.resolves.forEach(item => {
      item(param)
    })
  }
  let reject = function(param){
    _this.rejects.forEach(item => {
      item(param)
    })
  }
  fun(resolve, reject)
}
