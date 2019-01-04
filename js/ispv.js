$(document).ready(function () {
  var keyPair = null;
  var recentUTXO = [];

  function r(s) {
    result.val(s);
  }

  function b(o, i) {
    if (i) {
      o.prop("disabled", false);
    } else {
      o.prop("disabled", true);
    }
  }

  function xpc_to_mocha(v) {
    return Math.floor(v * 10000);
  }

  var key_loaded = function () {
    xpc_addr.val(XPChain.payments.p2wpkh({ pubkey: keyPair.publicKey, network: window.ISPV.network }).address);
    b(btn_delkey, true);
    b(btn_sendtx, true);
    b(btn_savekey, true);
    b(btn_dumpkey, true);
  }
  var key_unloaded = function () {
    b(btn_delkey, false);
    b(btn_sendtx, false);
    b(btn_savekey, false);
    b(btn_dumpkey, false);
  }

  var version_label = $("span.ver");
  var insight_link = $("#insight_url");
  var btn_utxo = $("#btn_utxo");
  var btn_impkey = $("#btn_impkey");
  var btn_delkey = $("#btn_delkey");
  var btn_loadkey = $("#btn_loadkey");
  var btn_savekey = $("#btn_savekey");
  var btn_dumpkey = $("#btn_dumpkey");
  var btn_genkey = $("#btn_genkey");
  var btn_sendtx = $("#btn_sendtx");
  var result = $("#result");
  var insight_api_url = $("#insight_api_url");
  var xpc_addr = $("#xpc_addr");
  var xpc_priv = $("#xpc_priv");
  var xpc_utxo = $("#xpc_utxo");
  var xpc_to = $("#xpc_to");
  var xpc_infee = $("#xpc_infee");
  var xpc_amount = $("#xpc_amount");
  var extra_data = $("#extra_data");
  var strg = window.localStorage;
  var strg_key = "xpc_ispv";
  var strg_data_str = null;
  var strg_data_obj = null;
  var strg_data_ver = 1;


  var VERSION_STR = "0.1.1 dev";
  var network_name = "mainnet";
  if(window.ISPV.network === XPChain.networks.testnet){
    network_name = "testnet";
    VERSION_STR += "(testnet2)";
    if (window.ISPV.defaults){
      if (window.ISPV.defaults.to){
        xpc_to.val(window.ISPV.defaults.to);
      }
      if (window.ISPV.defaults.amount){
        xpc_amount.val(window.ISPV.defaults.amount);
      }
    }
  }
  version_label.text(VERSION_STR);
  insight_link.attr("href",window.ISPV.insight_urls[network_name]);
  insight_api_url.val(window.ISPV.insight_api_urls[network_name]);


  b(btn_delkey, false);
  b(btn_sendtx, false);
  b(btn_savekey, false);
  b(btn_dumpkey, false);
  strg_data_str = strg.getItem(strg_key);
  if (strg_data_str !== null) {
    try {
      strg_data_obj = JSON.parse(strg_data_str);
    } catch (e) {
      strg_data_obj = null;
    }
  }
  if (strg_data_obj === null || strg_data_obj.version < strg_data_ver) {
    b(btn_loadkey, false);
  }


  var privkey_hash = window.location.hash.substr(1);
  if ($.trim(privkey_hash) !== "") {
    try {
      keyPair = XPChain.ECPair.fromWIF(
        privkey_hash, window.ISPV.network);
      /*
      xpc_addr.val(XPChain.payments.p2wpkh({ pubkey: keyPair.publicKey, network: window.ISPV.network }).address);
      b(btn_delkey,true);
      b(btn_sendtx,true);
      */
      key_loaded();
      alert("private key imported from URL fragment!(experimental)");
    } catch (e) {
      keyPair = null;
      console.error(e);
    }
  }

  btn_utxo.click(function () {
    var addr = $.trim(xpc_addr.val());
    if (addr == "") {
      alert("address is empty!");
      return false;
    }

    b(btn_utxo, false);
    try {
      r("please wait...");
      recentUTXO = [];

      $.ajax({
        type: 'GET',
        url: insight_api_url.val() + 'addr/' + addr + '/utxo',
        dataType: 'json',
      }).done(function (json) {
        if (!Array.isArray(json)) {
          throw "result not Array. insight version mismatch?";
        }
        var i;
        var res = "";
        for (i = 0; i < json.length; i++) {
          if (res !== "") { res += "\n"; }
          res += "UTXO #" + i + "\n" + JSON.stringify(json[i]) + "\n";
        }
        r(res);
        recentUTXO = json;
        xpc_utxo.val("0");
      }).fail(function (xhr, tstat, err) {
        r("" + tstat + ": " + err + " [" + xhr.responseText + "]");
      });
    } catch (e) {
      r("error: " + e);
    }
    b(btn_utxo, true);
  });

  btn_impkey.click(function () {
    try {
      if (keyPair !== null) {
        if (!confirm("key is already loaded. discard it?")) {
          return false;
        }
      }
      keyPair = XPChain.ECPair.fromWIF(
        xpc_priv.val(), window.ISPV.network);
      key_loaded();
    } catch (e) {
      keyPair = null;
      alert(e.toString());
    }
    xpc_priv.val("");
  });
  btn_delkey.click(function () {
    keyPair = null;
    key_unloaded();
  });
  btn_loadkey.click(function () {
    try {
      if (keyPair !== null) {
        if (!confirm("key is already loaded. discard it?")) {
          return false;
        }
      }

      strg_data_str = strg.getItem(strg_key);
      strg_data_obj = JSON.parse(strg_data_str);
      switch (strg_data_obj.version) {
        case 1:
          var enc = strg_data_obj.encrypted;
          var key = strg_data_obj.key;
          var ei = strg_data_obj.enc_info;
          if (!enc) {
            keyPair = XPChain.ECPair.fromWIF(
              key, window.ISPV.network);
          } else {
            var salt = CryptoJS.enc.Hex.parse(ei.salt);
            var iv = CryptoJS.enc.Hex.parse(ei.iv);
            var pass = prompt("input passphrase", "");
            if (pass == null || pass == "") {
              throw new Error("bad passphrase(empty)");
            }
            //todo continue...
          }
          key_loaded();
          break;
        default:
          throw new Error("bad data version: " + strg_data_obj.version);
      }
    } catch (e) {
      keyPair = null;
      alert(e.toString());
    }
  });
  btn_savekey.click(function () {
    strg_data_obj = {
      version: strg_data_ver,
      encrypted: false,
      key: keyPair.toWIF(),
      enc_info: { salt: null, iv: null }
    }
    strg_data_str = JSON.stringify(strg_data_obj);
    strg.setItem(strg_key, strg_data_str);
    b(btn_loadkey, true);
  });
  btn_dumpkey.click(function () {
    try {
      if (keyPair === null) {
        throw new Error("key is empty!");
      }
      prompt("copy private key", keyPair.toWIF());
      //xpc_priv.val(keyPair.toWIF());
    } catch (e) {
      alert(e.toString());
    }
  });
  btn_genkey.click(function () {
    try {
      if (keyPair !== null) {
        if (!confirm("key is already loaded. discard it?")) {
          return false;
        }
      }
      keyPair = XPChain.ECPair.makeRandom({ network: window.ISPV.network });
      key_loaded();
    } catch (e) {
      alert(e.toString());
    }
  });


  btn_sendtx.click(function () {
    var size = 1000;//1kB
    var fee = 0.1;//XPC
    var feemsg = "";
    var ajaxed = false;
    b(btn_sendtx, false);
    try {
      var amount_send = parseFloat(xpc_amount.val());
      var toaddr = $.trim(xpc_to.val());
      if (isNaN(amount_send) || !isFinite(amount_send) || amount_send < window.ISPV.dust) {
        alert("amount is invalid or dust.");
        return false;
      }
      amount_send = Math.floor(amount_send * 10000) / 10000;
      xpc_amount.val(amount_send);

      if (toaddr == "") {
        alert("send to address is empty");
        return false;
      }

      var utxo_str = xpc_utxo.val();
      var utxo_idx = parseInt(utxo_str);
      var target_utxo = null;
      if (isNaN(utxo_idx)) {
        //JSON
        try {
          target_utxo = JSON.parse(utxo_str);
        } catch (e) {
          alert("UTXO is neither index nor valid JSON");
          return false;
        }
      } else {
        //index
        if (utxo_idx < 0 || utxo_idx >= recentUTXO.length) {
          alert("UTXO index out of range.");
          return false;
        }
        target_utxo = recentUTXO[utxo_idx];
      }

      var mywpkh = XPChain.payments.p2wpkh({
        pubkey: keyPair.publicKey, network: window.ISPV.network
      });
      var built_tx = null;
      var actual_size = -1;

      while (true) {
        switch (window.ISPV.feetype) {
          case "per":
            fee = Math.floor((window.ISPV.fee * size) * 10.0) / 10000.0;
            feemsg = " [" + window.ISPV.fee + "/kB]";
            if (!xpc_infee.prop("checked")) {
              feemsg += " total " + (fee + amount_send);
            } else {
              feemsg += " included";
            }
            //console.log("fee calculated: " + size + "byte, fee=" + fee);
            break;
          case "fix":
            fee = window.ISPV.fee;
            break;
          default:
            throw new Error("bad fee type!" + window.ISPV.feetype);
        }
        var tmsend = amount_send;
        if (xpc_infee.prop("checked")) {
          tmsend = amount_send - fee;
        }
        if (tmsend > target_utxo.amount) {
          alert("sending amount is larger than UTXO's one: " + tmsend + ">" + target_utxo.amount);
          return false;
        }
        var change = target_utxo.amount - (tmsend + fee);
        //console.log("send=" + tmsend + ", fee=" + fee + ", charge=" + change);
        if (change !== 0 && change < window.ISPV.dust) {
          if (window.ISPV.feetype !== "per" || actual_size > 0) {
            if (change < 0) {
              alert("insufficiant UTXO amount: " + target_utxo.amount + " < " + (tmsend + fee));
            } else if (change > 0 && change < window.ISPV.dust) {
              alert("change is too low!: " + change);
            }
            return false;
          } else {
            //set temp fee for recalculation...?
            fee = 0.0001;//1 mocha
            tmsend = target_utxo.amount - fee;
            if (tmsend > amount_send) {
              fee = tmsend - amount_send;
              tmsend = amount_send;
            }
            change = 0;
          }
        }

        var txb = new XPChain.TransactionBuilder(window.ISPV.network);
        var txin0 = txb.addInput(target_utxo.txid, target_utxo.vout, null, mywpkh.output);
        var txout0 = txb.addOutput(toaddr, xpc_to_mocha(tmsend));
        var exmsg = "";
        if ($.trim(extra_data.val()) !== "") {
          var data = XPChain.lib.Buffer.from(extra_data.val(), 'utf8');
          var embed = XPChain.payments.embed({ data: [data] });
          var txoutx = txb.addOutput(embed.output, 0);
          exmsg = " and extra data";
        }
        if (change > 0) {
          var txout1 = txb.addOutput(mywpkh.address, xpc_to_mocha(change));
        }
        txb.sign(txin0, keyPair, null, null, xpc_to_mocha(target_utxo.amount));
        built_tx = txb.build();
        actual_size = built_tx.virtualSize();
        if (window.ISPV.feetype === "per" && size !== actual_size) {
          size = actual_size;
        } else {
          break;
        }
      }

      var tx = built_tx.toHex();
      if (confirm("send \n\n" + amount_send + " XPC (with " + fee + " XPC fee" + feemsg + ")" + exmsg + "\n\nto\n\n" + toaddr + "\n\nproceed ok?") == false) {
        return false;
      }
      //window.ISPV.tx = built_tx; 
      //r("DEBUG: \n" + tx);
      //return false;
      if (!window.ISPV.dryrun) {
        $.ajax({
          type: 'POST',
          url: insight_api_url.val() + 'tx/send',
          dataType: 'text',
          data: "rawtx=" + tx,
        }).done(function (sendres) {
          r(sendres);
        }).fail(function (xhr, tstat, err) {
          r("" + tstat + ": " + err + " [" + xhr.responseText + "]");
        }).always(function () { b(btn_sendtx, true); });
      } else {
        r("DRY RUN: raw tx is \n" + tx);
      }
    } catch (e) {
      alert(e.toString());
    } finally {
      if (!ajaxed) { b(btn_sendtx, true); }
    }
  });
});