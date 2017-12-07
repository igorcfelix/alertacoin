  // Generate the user private channel
  var channel = generateUserChannel();

  $(document).ready(function() {

    // In this example we are using a demo Realtime application key without any security
    // so you should replace it with your own appkey and follow the guidelines
    // to configure it
      var RealtimeAppKey = "jW48FJ";

    // update the UI  
    $('#curl').text('curl "http://ortc-developers-useast1-s0001.realtime.co/send" --data "AK=' + RealtimeAppKey + '&AT=SomeToken&C=' + channel + '&M=12345678_1-1_This is a web push notification sent using the Realtime REST API"');
    $('#channel').text(channel);
      
    // start Web Push Manager to obtain device id and register it with Realtime
    // a service worker will be launched in background to receive the incoming push notifications
    var webPushManager = new WebPushManager();

    webPushManager.start(function(error, registrationId){
      if (error) {
        
        if(error.message) {
          alert(error.message);
        } else {
          alert("Ooops! It seems this browser doesn't support Web Push Notifications :(");
        }
        
        $("#curl").html("Oops! Something went wrong. It seems your browser does not support Web Push Notifications.<br><br>Error:<br>" + error.message);
        $("#sendButton").text("No can do ... this browser doesn't support web push notifications");
        $("#sendButton").css("background-color","red");
      };
     
      // Create Realtime Messaging client
      client = RealtimeMessaging.createClient();
      client.setClusterUrl('https://ortc-developers.realtime.co/server/ssl/2.1/');
    
      client.onConnected = function (theClient) {
        // client is connected

        // subscribe users to their private channels
        theClient.subscribeWithNotifications(channel, true, registrationId,
            function (theClient, channel, msg) {
              // while you are browsing this page you'll be connected to Realtime
              // and receive messages directly in this callback
              console.log("Received a message from the Realtime server:", msg);

              // Since the service worker will only show a notification if the user
              // is not browsing your website you can force a push notification to be displayed.
              // For most use cases it would be better to change the website UI by showing a badge
              // or any other form of showing the user something changed instead
              // of showing a pop-up notification.
              // Also consider thar if the user has severals tabs opened it will see a notification for
              // each one ...
              webPushManager.forceNotification(msg);
            });
      };
    
      // Establish the connection
      client.connect(RealtimeAppKey, 'JustAnyRandomToken');  
    });    


    if (typeof (Storage) !== "undefined") {
        console.log("storage ok");
        alimentarValores();
    } else {
        alert('problema com storage');
    }
});

// generate a GUID
function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}

// generate the user private channel and save it at the local storage
// so we always use the same channel for each user
function generateUserChannel(){
  userChannel = localStorage.getItem("channel");
  if (userChannel == null || userChannel == "null"){ 
      guid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();               
      userChannel = 'channel-' + guid;
      localStorage.setItem("channel", userChannel);
  }
  return userChannel;
}

var myVar;
// send a message to the user private channel to trigger a push notification
function send() {
    localStorage.setItem("nome", $("#txtNome").val());
    localStorage.setItem("qtdCoins", $("#txtQdtCoins").val());
    localStorage.setItem("valorpago", $("#txtValorPago").val());
    alertFunc();
    myVar = setInterval(alertFunc, 300000);
}

function alimentarValores() {
    $("#txtNome").val(localStorage.getItem("nome"));
    $("#txtQdtCoins").val(localStorage.getItem("qtdCoins"));
    $("#txtValorPago").val(localStorage.getItem("valorpago"));
}

function alertFunc() {
    if (client) {
        $.get("https://www.mercadobitcoin.com.br/api/btc/ticker/", function (data) {
            $(".result").html(data);

            var nome, qtdCoins, valorPago, valorAtual, valorGanho, totalGanho, rendimentoReais, rendimentoPercentual, saida;

            nome = localStorage.getItem("nome");
            qtdCoins = localStorage.getItem("qtdCoins");
            valorPago = localStorage.getItem("valorpago");
            valorAtual = data.ticker.last;

            valorPagoCoins = parseFloat(valorPago.replace(",", ".")) * parseFloat(qtdCoins.replace(",", "."));
            totalGanho = parseFloat(valorAtual.replace(",", ".")) * parseFloat(qtdCoins.replace(",", "."));
            rendimentoReais = parseFloat(totalGanho) - parseFloat(valorPagoCoins);
            rendimentoPercentual = (rendimentoReais * 100) / parseFloat(valorPagoCoins);

            saida = 'Ola ' + nome + '\r\n';
            saida += 'Valor atual R$ ' + mascaraValor(Math.round(parseFloat(valorAtual).toFixed(2))) + '\r\n';
            saida += 'Valor total ganho R$ ' + mascaraValor(Math.round(parseFloat(totalGanho + '00'))) + '\r\n';
            saida += 'Rend em reais R$ ' + mascaraValor(Math.round(parseFloat(rendimentoReais + '00'))) + '\r\n';
            saida += 'Rend em percentual ' + Math.round(rendimentoPercentual) + " %";

            client.send(channel, saida);
            console.log(data);
        });
        
    };
}

function mascaraValor(valor) {
    valor = valor.toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
    return valor
}
