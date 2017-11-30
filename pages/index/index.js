//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    userInfo: {},
    tipsModalShow: false,
    bleZoneShow:false,
    deviceName:"",
    deviceMac:"",
    actionBle:"连接蓝牙",
    content:""
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  //事件处理函数
  bindViewTap1: function () {
    var that = this;
    if (getApp().ble.isConnected) {
      getApp().ble.disconnectBle(function(res){
        that.setData({ bleStatus: that.data.deviceName + "蓝牙已断开", actionBle: "连接蓝牙", bleZoneShow: false});
        getApp().ble.isConnected = false;
        wx.removeStorageSync("ble_mac");
        wx.removeStorageSync("ble_name");
      });
    } else {
      wx.navigateTo({
        url: '../scanble/scanble'
      })
    }
  },
  onLoad: function () {
    var that = this;
    console.log('onLoad')
    this.data.deviceName = wx.getStorageSync("ble_name");
    this.data.deviceMac = wx.getStorageSync("ble_mac");
    console.log("loaded:ble_name = " + this.data.deviceName + ",ble_mac = " + this.data.deviceMac);
    wx.openBluetoothAdapter({
      success: function(res) {
        getApp().ble.connectBle(that.data.deviceMac, {
          onSuccess: function () {
            that.setData({ bleStatus: that.data.deviceName + "蓝牙已连接", actionBle: "断开蓝牙", bleZoneShow:true});
          }, onFailure: function () {

          }
        })
      },
    })
    getApp().ble.registerBleResponse(function (characteristic) {
      if (characteristic.characteristicId.indexOf("2AF0") != -1) {
        const result = characteristic.value;
        const hex = getApp().ble.buf2hex(result);
        that.setData({ result: that.data.result+"\n"+hex });
      }
    });

    getApp().ble.registerBleStatusResponse(function (res) {
      if (!res.connected) {
        that.setData({
          tipsModalShow: true,
          bleStatus: that.data.deviceName + "蓝牙已断开", 
          actionBle: "连接蓝牙", 
          bleZoneShow: false
        })
      }else{
          that.setData({ bleStatus: that.data.deviceName + "蓝牙已连接", actionBle: "断开蓝牙", bleZoneShow: true });
      }
    });
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function (userInfo) {
      //更新数据
      that.setData({
        userInfo: userInfo
      })
    })
  }
  , onShow: function () {
    if (!getApp().ble.isConnected) {
      this.setData({
        bleStatus: this.data.deviceName + "蓝牙已断开",
        actionBle: "连接蓝牙",
        bleZoneShow: false
      })
    } else {
      this.setData({ bleStatus: this.data.deviceName + "蓝牙已连接", actionBle: "断开蓝牙", bleZoneShow: true });
    }
  },
  contentInput: function (e) {
    this.setData({
      content: e.detail.value
    })
  },
  modalBindconfirm: function () {
    this.setData({
      tipsModalShow: false,
    })
    wx.redirectTo({
      url: '../scanble/scanble'
    })
  },
  modalBindcancel: function () {
    this.setData({
      tipsModalShow: false,
    })

  },
  /**
   * 发送 数据到设备中
   */
  bindViewTap: function () {
    var hex = this.data.content;
    getApp().ble.send(hex);
  },
  onUnload:function(){
    console.log('onUnload')
    wx.closeBluetoothAdapter({
      success: function(res) {
        
      },
    })
  }
})
