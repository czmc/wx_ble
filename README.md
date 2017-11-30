# wx_ble
微信小程序 低功耗蓝牙模块封装
## 1.简述
 - 蓝牙适配器接口是基础库版本 1.1.0 开始支持。
 - iOS 微信客户端 6.5.6 版本开始支持，Android 客户端暂不支持

## 2.官方API
详细见官网：
[https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxgetconnectedbluethoothdevicesobject](https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxgetconnectedbluethoothdevicesobject)
## 3.引用
  var Ble = require('./ble/ble.js').Ble
## 4.搜索
    String.prototype.startWith = function (str) {
        var reg = ;
        return reg.test(this);
    }
    Ble.scanBle(1000, 10000,
    function (result) {
       //do shomthing
    },
    function (deviceName) {
        if (deviceName.startWith('TW')) {
          return true;
        }
        return false;
    });
  }

## 5.连接
 var Ble = require('./ble/ble.js').Ble
  Ble.connectBle(deviceMac, deviceName, {
      onSuccess: function () {
        //do shomthing
      },
      onFailure(errorCode){
        console.log(errorCode);
      }
    });
