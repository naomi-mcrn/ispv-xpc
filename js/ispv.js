///<reference path="./jquery-1.12.4.min.js" />
"use strict";
$(document).ready(function () {
  var keyPair = null;
  var recentUTXO = [];
  var mode = "simple";

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

  function change_mode(){
    switch (mode) {
      case "simple":
        xpc_infee_label.removeClass("hide");
        xpc_infee.removeClass("hide");
        xpc_count_row.addClass("hide");
        xpc_amount_title.text("amount(XPC)");
        break;
      case "splitter":
        xpc_infee_label.addClass("hide");
        xpc_infee.addClass("hide");
        xpc_count_row.removeClass("hide");
        xpc_amount_title.text("each amount(XPC)");
        break;
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
  var rdo_modes = $("input[name=mode]");
  var result = $("#result");
  var insight_api_url = $("#insight_api_url");
  var xpc_addr = $("#xpc_addr");
  var xpc_priv = $("#xpc_priv");
  var xpc_utxo = $("#xpc_utxo");
  var xpc_to = $("#xpc_to");
  var xpc_infee = $("#xpc_infee");
  var xpc_infee_label = $("#xpc_infee_label");
  var xpc_amount = $("#xpc_amount");
  var xpc_amount_title = $("#xpc_amount_title");
  var xpc_count = $("#xpc_count");
  var xpc_count_row = $("#xpc_count_row");
  var extra_data = $("#extra_data");
  var strg = window.localStorage;
  var strg_key = "xpc_ispv";
  var strg_data_str = null;
  var strg_data_obj = null;
  var strg_data_ver = 1;

  var VERSION_STR = "0.1.1";
  var network_name = "mainnet";
  if (window.ISPV.network === XPChain.networks.testnet) {
    network_name = "testnet";
    VERSION_STR += "(testnet2)";
  }
  version_label.text(VERSION_STR);
  insight_link.attr("href", window.ISPV.insight_urls[network_name]);
  insight_api_url.val(window.ISPV.insight_api_urls[network_name]);
  //default setting
  if (window.ISPV.defaults && window.ISPV.defaults[network_name]){
    if (window.ISPV.defaults[network_name].to){
      xpc_to.val(window.ISPV.defaults[network_name].to);
    }
    if (window.ISPV.defaults[network_name].amount){
      xpc_amount.val(window.ISPV.defaults[network_name].amount);
    }
    if (window.ISPV.defaults[network_name].mode){
      mode = window.ISPV.defaults[network_name].mode;
    }
    if (window.ISPV.defaults[network_name].count >= 1){
      xpc_count.val(window.ISPV.defaults[network_name].count);
    }
    if (window.ISPV.defaults[network_name].infee === true){
      xpc_infee.prop("checked",true).attr("checked","checked");
    }
  }
  rdo_modes.prop("checked",false).removeAttr("checked");
  $("#mode_" + mode).prop("checked",true).attr("checked","checked");
  change_mode();

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
      var count = parseInt(xpc_count.val());
      var amount_send = parseFloat(xpc_amount.val());
      var whole_amount;
      var toaddr = $.trim(xpc_to.val());
      if (isNaN(amount_send) || !isFinite(amount_send) || amount_send < window.ISPV.dust) {
        alert("amount is invalid or dust.");
        return false;
      }
      amount_send = Math.floor(amount_send * 10000) / 10000;
      xpc_amount.val(amount_send);
      whole_amount = amount_send * count;

      if (toaddr == "") {
        alert("send to address is empty");
        return false;
      }

      var utxo_str = xpc_utxo.val();
      var utxo_idx = parseInt(utxo_str);
      var utxo_arr = utxo_str.split(",");
      var tutxo = null;
      var target_utxos = [];
      var target_utxo_indices = [];
      var target_utxo_amount_sum = 0;
      if (utxo_arr.length > 1) {
        //CSV(multiple)
        for (let i = 0; i < utxo_arr.length; i++) {
          utxo_idx = parseInt(utxo_arr[i]);
          if (isNaN(utxo_idx)){
            alert("Bad UTXO index at " + i + ".");
            return false;
          }
          if (utxo_idx < 0 || utxo_idx >= recentUTXO.length) {
            alert("UTXO index out of range.");
            return false;
          }
          target_utxos.push(recentUTXO[utxo_idx]);
          target_utxo_indices.push(utxo_idx);
          target_utxo_amount_sum += recentUTXO[utxo_idx].amount;
        }
      } else {
        if (isNaN(utxo_idx)) {
          //JSON
          try {
            tutxo = JSON.parse(utxo_str);
            target_utxos.push(tutxo);
            target_utxo_indices.push(0);
            target_utxo_amount_sum += tutxo.amount;
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
          target_utxos.push(recentUTXO[utxo_idx]);
          target_utxo_indices.push(utxo_idx);
          target_utxo_amount_sum += recentUTXO[utxo_idx].amount;
        }
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
            //console.log("fee calculated: " + size + "byte, fee=" + fee);
            break;
          case "fix":
            fee = window.ISPV.fee;
            break;
          default:
            throw new Error("bad fee type!" + window.ISPV.feetype);
        }
        var tmamnt = whole_amount + fee; //tmsend must be equal or less than UTXO amount.
        if (tmamnt > target_utxo_amount_sum) {
          alert("sending whole amount is larger than UTXO(s) amount: " + tmamnt + ">" + target_utxo_amount_sum);
          return false;
        }
        var change = target_utxo_amount_sum - tmamnt;
        //console.log("send=" + whole_amount + ", fee=" + fee + ", charge=" + change);
        if (change !== 0 && change < window.ISPV.dust) {
          if (window.ISPV.feetype !== "per" || actual_size > 0) {
            if (change < 0) {
              alert("insufficiant UTXO(s) amount: " + target_utxo_amount_sum + " < " + (tmamnt + fee));
            } else if (change > 0 && change < window.ISPV.dust) {
              alert("change is too low!: " + change);
            }
            return false;
          } else {
            //set temp fee for recalculation...?
            fee = 0.0001;//1 mocha
            change = 0;
          }
        }

        var txb = new XPChain.TransactionBuilder(window.ISPV.network);
        var txouts = [];
        var txout;
        var txins = [];
        var txin;
        for (let i = 0; i < target_utxos.length; i++) {
          if (!target_utxos[i].confirmations){
            alert("UTXO #" + target_utxo_indices[i] + ": confirmations info missing. may be Coinbase Tx.");
            return false;
          }else if(target_utxos[i].confirmations < window.ISPV.min_conf){
            alert("UTXO #" + target_utxo_indices[i] + ": confirmatioins less than minimum (" + window.ISPV.min_conf + ")");
            return false;
          }
          txin = txb.addInput(target_utxos[i].txid, target_utxos[i].vout, null, mywpkh.output);
          txins.push(txin);
          console.log(txin);
        }
        for (let i = 0; i < count; i++) {
          txout = txb.addOutput(toaddr, xpc_to_mocha(amount_send));
          txouts.push(txout);
        }
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
        for (let i = 0; i < target_utxos.length; i++) {
          txb.sign(txins[i], keyPair, null, null, xpc_to_mocha(target_utxos[i].amount));
        }
        built_tx = txb.build();
        actual_size = built_tx.virtualSize();
        if (window.ISPV.feetype === "per" && size !== actual_size) {
          size = actual_size;
        } else {
          break;
        }
      }

      var tx = built_tx.toHex();
      if (confirm("send \n\n" + whole_amount + " XPC <@" + amount_send + " XPC * " + count + "> (with " + fee + " XPC fee" + feemsg + ")" + exmsg + "\n\nto\n\n" + toaddr + "\n\nproceed ok?") == false) {
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

  rdo_modes.change(function (){
    mode = $(this).val();
    change_mode();
  })
});