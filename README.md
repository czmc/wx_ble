# wx_ble
微信小程序 低功耗蓝牙模块封装
## 1.简述
 - 蓝牙适配器接口是基础库版本 1.1.0 开始支持。
 - iOS 微信客户端 6.5.6 版本开始支持，Android 客户端暂不支持
 - 发送队列支持,全局管理等特性

## 2.官方API
详细见官网：
[https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxgetconnectedbluethoothdevicesobject](https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxgetconnectedbluethoothdevicesobject)
## 3.引用
  var Ble = require('./ble/ble.js').Ble
  var ble = new Ble();
## 4.搜索
    ble.scanBle(1000, 10000,
    function (result) {
       //do shomthing
    },
    function (deviceName) {
        return true;
    });
  }

## 5.连接
    ble.connectBle(deviceMac, deviceName, {
        onSuccess: function () {
          //do shomthing
        },
        onFailure(errorCode){
          console.log(errorCode);
        }
    });
