//Getting Your API Key
function fetchApiKey(callback) {
    var myKey = '1SZKGEEHOWNRCJ8SJ';
    $.ajax( {
            type:"GET", 
            dataType: "json", 
            xhrFields: { withCredentials: true }, 
            url: "http://developer.echonest.com/user/api_key.json" /* This url returns the JSON code with the data the customer is search for */
        }).then(
            function(data){
                if (callback) {
                    if (data.logged_in) {
                        callback(data.api_key, data.logged_in);
                    } else {
                        callback(myKey, data.logged_in);
                    }
                }
            }, 
            function(data){
                if (callback) {
                    callback(myKey, false);
                }
            }
        );
}