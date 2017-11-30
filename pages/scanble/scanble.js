/**
 * 搜索设备界面
 */
Page({
  data: {
    list: [],
    showLoadding: false
  },
  onLoad: function () {
    var that = this;
    //开始搜索
    getApp().ble.scanBle(1000, 10000, function (result) {

      that.setData({list: result});

    }, function (deviceName) {
      String.prototype.startWith = function (str) {
        var reg = new RegExp("^" + str);
        return reg.test(this);
      }
      if (deviceName.startWith('TW')) {
        return true;
      }
      return false;
    });
  },
  onUnload:function(){
    getApp().ble.stopScanBle();
  }
  ,
  //点击连接
  bindViewTap: function (e) {
    console.log(e.currentTarget.dataset.title);
    console.log(e.currentTarget.dataset.name);
    console.log(e.currentTarget.dataset.advertisData);

    var deviceMac = e.currentTarget.dataset.title;
    var deviceName = e.currentTarget.dataset.name;

    var that = this;
    this.setData({ showLoadding: true });

    getApp().ble.connectBle(deviceMac, {
      onSuccess: function () {
        that.setData({ showLoadding: false });
        wx.setStorage({key: "ble_mac",data: deviceMac});
        wx.setStorage({key: "ble_name",data: deviceName});
        console.log("saved ble_mac=" + deviceMac + ",ble_name=" + deviceName);
        wx.navigateBack({ url: '../index/index'});
      },
      onFailure: function (errorCode) {
        that.setData({ showLoadding: false });
        console.log(errorCode);
      }
    });
  }
})
