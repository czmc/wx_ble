/**
 * @module 蓝牙ble
 * @anthor czmc
 * @date 2017.11.30 
 * @descrition:
 *  搜索 scanBle(interval, timeout, callback, fillter); interval:间隔,timeout:搜索几秒 ,callback:搜索回调,fillter:过滤器
 *  连接 connectBle(bleMac, connectRes)
 *  断开 disconnectBle(callback)
 *  发送 sendBLECommandQuque(cmd)
 *  注册状态监听(单页面) registerBleStatusResponse
 *  注册响应监听(单页面) registerBleResponse
 * 
 * 使用示例:
 * var Ble = require('./ble/ble.js').Ble
 * Ble.scanBle(1000,10000,xxx,xxx);
 */

var Ble = {
  bleMac: "",
  bleServiceCharacteristic: "",
  bleWriteCharacteristic: "",
  bleReadCharacteristic: "",
  isBleIdle: true,
  bleCommandQueue: new Array(),
  timeOut: null,
  response: null,
  statusRespose: null,
  isConnected: false,
  scanTimeoutId1: 0,
  scanTimeoutId2: 0,
  /**
   * 发送蓝牙命令到队列
   **/
  sendBLECommandQuque: function (cmd) {
    this.bleCommandQueue.push(cmd);
    console.log("queue size:" + this.bleCommandQueue.length);
    //当队列循环完之后有新命令触发
    if (this.isBleIdle) {
      this.nextCmd();
    }
  },
  /**
   * 是否是规范的通讯命令
   **/
  isBleCommand: function (cmd) {
    if (cmd === null) {
      return false;
    }
    return /^02.*03$/.test(cmd)
  },
  /**
   * 创建规范的通讯命令
   */
  buildCommand: function (cmd, params) {
    //拼接命令参数
    params = params === null ? '' : params + "";
    var cmds = '02' + cmd + params + '03';
    return cmds;
  },
  /**
   * 发送
   */
  send(cmd, params) {
    this.sendBLECommandQuque(this.buildCommand(cmd, params));
  }
  ,
  /**
   * 发送通讯命令
   */
  sendBLECommand: function (cmd) {
    var that = this;
    this.isBleIdle = false;
    //超时
    this.timeOut = setTimeout(function () {
      that.nextCmd();
    }, 6000);
    console.log("命令:" + cmd)
    //转化16进制
    var typedArray = new Uint8Array(cmd.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }))
    var buffer1 = typedArray.buffer
    wx.writeBLECharacteristicValue({
      deviceId: that.bleMac,
      serviceId: that.bleServiceCharacteristic,
      characteristicId: that.bleWriteCharacteristic,
      value: buffer1,
      success: function (res) {
        // success
        console.log("success  指令发送成功");
        console.log(res);
      },
      fail: function (res) {
        // fail
        console.log(res);
      },
      complete: function (res) {
        // complete
      }
    })
  },
  /**
   * 注册响应
   */
  registerBleResponse(res) {
    this.response = res;
  },
  /**
   * 注册状态响应
   */
  registerBleStatusResponse(res) {
    this.statusResponse = res;
  },


  /**
   * 执行队列下个命令
   */
  nextCmd: function () {
    if (this.bleCommandQueue.length > 0) {
      var sendCmd = this.bleCommandQueue.pop();
      if (this.isBleCommand(sendCmd)) {
        this.sendBLECommand(sendCmd)
      } else {
        console.log("命令格式错误");
        this.nextCmd();
      }
    } else {
      this.isBleIdle = true;
    }
  },
  /**
   * 全局唯一响应监听 数据中心
   */
  registerBleResponseSingle: function () {
    /**
     * 回调获取 设备发过来的数据
     */
    var that = this;
    wx.onBLECharacteristicValueChange(function (characteristic) {
      console.log('characteristic value comed:', characteristic.value)
      if (characteristic.characteristicId.indexOf("2AF0") != -1) {
        clearTimeout(that.timeOut);
        const result = characteristic.value;
        const hex = that.buf2hex(result);
        console.log(hex);
        that.nextCmd();

        that.response(characteristic);

      }
      if (characteristic.characteristicId.indexOf("2AF1") != -1) {
        const result = characteristic.value;
        const hex = that.buf2hex(result);
        console.log(hex);
      }

    })
  },

  /**
   * 数据转16进制
   */
  buf2hex: function (buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  },
  /**
   * 注册蓝牙状态监听
   */
  registerBleStatusChange: function () {
    var that = this;
    wx.onBLEConnectionStateChanged(function (res) {
      that.isConnected = res.connected;
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
      that.statusResponse(res);
    })
  },
  /**
   * 断开连接
   */
  disconnectBle: function (callback) {
    var that = this;
    if (that.bleMac != null) {
      wx.closeBLEConnection({
        deviceId: that.bleMac,
        success: callback
      })
    }
  },
  /**
   * 连接蓝牙  errorcode 超时 1001 连接失败 1002 获取服务失败 1003  获取特征失败  1004
   */
  connectBle: function (bleMac, connectRes) {
    console.log("connectBle");
    this.bleMac = bleMac;
    var that = this;
    var timeout = setTimeout(function () {
      connectRes.onFailure(1001);
    }, 10000);
    wx.createBLEConnection({
      deviceId: bleMac,
      success: function (res) {
        // success
        console.log(res);
        /**
         * 连接成功，后开始获取设备的服务列表
         */
        wx.getBLEDeviceServices({
          // 这里的 deviceId 需要在上面的 getBluetoothDevices中获取
          deviceId: bleMac,
          success: function (res) {
            console.log('device services:', res.services)
            for (var i = 0; i < res.services.length; i++) {
              if (res.services[i].uuid.indexOf("18F0") != -1) {
                that.bleServiceCharacteristic = res.services[i].uuid;
                console.log('设备mac:', that.bleMac);
                console.log('服务uuid:', that.bleServiceCharacteristic);
                break;
              }
            }
            /**
             * 延迟x秒，根据服务获取特征 
             */
            setTimeout(function () {
              wx.getBLEDeviceCharacteristics({
                // 这里的 deviceId 需要在上面的 getBluetoothDevices
                deviceId: that.bleMac,
                // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
                serviceId: that.bleServiceCharacteristic,
                success: function (res) {
                  console.log('所有特征值:', res.characteristics)
                  for (var i = 0; i < res.characteristics.length; i++) {
                    if (res.characteristics[i].uuid.indexOf("2AF0") != -1) {
                      that.bleReadCharacteristic = res.characteristics[i].uuid;
                    }
                    if (res.characteristics[i].uuid.indexOf("2AF1") != -1) {
                      that.bleWriteCharacteristic = res.characteristics[i].uuid;
                    }
                  }
                  console.log('sevice uuid= ' + that.bleServiceCharacteristic
                    + '\nread uuid= ' + that.bleReadCharacteristic
                    + '\nwrite uuid= ' + that.bleWriteCharacteristic);

                  /**
                   * 顺序开发设备特征notifiy
                   */
                  wx.notifyBLECharacteristicValueChanged({
                    deviceId: that.bleMac,
                    serviceId: that.bleServiceCharacteristic,
                    characteristicId: that.bleReadCharacteristic,
                    state: true,
                    success: function (res) {
                      // success
                      //监听蓝牙响应       
                      that.registerBleResponseSingle();
                      that.registerBleStatusChange();
                      that.isConnected = true;
                      console.log('notifyBLECharacteristicValueChanged success', res);
                      clearTimeout(timeout);
                      connectRes.onSuccess();
                    },
                    fail: function (res) {
                      // fail
                    },
                    complete: function (res) {
                      clearTimeout(timeout);
                      connectRes.onFailure(1004);
                    }
                  })

                  wx.notifyBLECharacteristicValueChanged({
                    deviceId: that.bleMac,
                    serviceId: that.bleServiceCharacteristic,
                    characteristicId: that.bleWriteCharacteristic,
                    state: true,
                    success: function (res) {
                      // success
                      console.log('notifyBLECharacteristicValueChanged success', res);

                    },
                    fail: function (res) {
                      // fail
                    },
                    complete: function (res) {
                      // complete
                    }
                  })
                }, fail: function (res) {
                  console.log(res);
                  clearTimeout(timeout);
                  connectRes.onFailure(1003);
                }
              })
            }, 1500);
          }
        })
      },
      fail: function (res) {
        clearTimeout(timeout);
        connectRes.onFailure(1002);
      },
      complete: function (res) {
        // complete
      }
    })
  },
  /**
   * 搜索蓝牙
   **/
  scanBle: function (interval, timeout, callback, fillter) {
    var that = this;
    wx.openBluetoothAdapter({
      success: function (res) {
        // success
        console.log("openBluetoothAdapter scuccess");
        console.log(res);
        wx.startBluetoothDevicesDiscovery({
          services: [],
          success: function (res) {
            // success
            console.log("startBluetoothDevicesDiscovery");
            console.log(res);
          },
          fail: function (res) {
            // fail
            console.log(res);
          },
          complete: function (res) {
            // complete
            console.log(res);
          }
        })
      },
      fail: function (res) {
        console.log("openBluetoothAdapter fail");
        // fail
        console.log(res);
      },
      complete: function (res) {
        // complete
        console.log("openBluetoothAdapter complete");
        console.log(res);
      }
    })
    that.scanTimeoutId1 = setInterval(function () {
      //1秒一次获取搜索到的蓝牙
      wx.getBluetoothDevices({
        success: function (res) {
          var reslut1 = new Array();
          if (res.devices != null && res.devices.length > 0) {
            for (var b in res.devices) {
              if (fillter(res.devices[b].name)) {
                console.log(res.devices[b]);
                reslut1.push(res.devices[b]);
              }
            }
          }
          callback(reslut1);
        },
        fail: function (res) {
          // fail
        },
        complete: function (res) {
          // complete
        }
      })
    }, interval);
    //timeout 秒清除现场
    that.scanTimeoutId2 = setTimeout(function () {
      clearInterval(that.scanTimeoutId1);
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) { },
      })
    }, timeout);
  },
  stopScanBle: function () {

    clearInterval(this.scanTimeoutId1);
    clearInterval(this.scanTimeoutId2);
  }
};

module.exports = {
  Ble: Ble,
}